<?php

namespace App\Modules\Laboratory\Services;

use App\Modules\Laboratory\Models\LaboDemande;
use App\Modules\Laboratory\Models\LaboResult;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class LaboResultService
{
    /**
     * Enter results for a laboratory demande.
     * Creates LaboResult rows from the results array.
     * Updates demande status to 'completed' if all items have results, otherwise 'in_progress'.
     *
     * @param int $demandeId
     * @param array $results Array of ['sub_analysis_name', 'numeric_value', 'text_value', 'unit', 'reference_range', 'labo_demande_item_id']
     * @return LaboDemande
     */
    public function enterResults(int $demandeId, array $results): LaboDemande
    {
        return DB::transaction(function () use ($demandeId, $results) {
            $demande = LaboDemande::findOrFail($demandeId);

            foreach ($results as $result) {
                LaboResult::create([
                    'labo_demande_id' => $demandeId,
                    'labo_demande_item_id' => $result['labo_demande_item_id'],
                    'sub_analysis_name' => $result['sub_analysis_name'],
                    'numeric_value' => $result['numeric_value'] ?? null,
                    'text_value' => $result['text_value'] ?? null,
                    'unit' => $result['unit'] ?? null,
                    'reference_range' => $result['reference_range'] ?? null,
                    'performed_by' => Auth::id(),
                ]);
            }

            // Determine new status: completed if all items have at least one result, otherwise in_progress
            $totalItems = $demande->items()->count();
            $itemsWithResults = $demande->results()
                ->distinct('labo_demande_item_id')
                ->count('labo_demande_item_id');

            $newStatus = ($itemsWithResults >= $totalItems) ? 'completed' : 'in_progress';

            $demande->update(['status' => $newStatus]);

            return $demande->fresh()->load(['items', 'results']);
        });
    }

    /**
     * Get paginated worklist of LaboDemande with status pending/in_progress.
     * Filterable by date, urgency, and patient search.
     * Eager-loads items, consultation.patient, requestedBy.
     */
    public function getWorklist(array $filters): LengthAwarePaginator
    {
        $query = LaboDemande::whereIn('status', ['pending', 'in_progress'])
            ->with(['items', 'consultation.patient', 'requestedBy']);

        if (!empty($filters['date'])) {
            $query->whereDate('created_at', $filters['date']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (!empty($filters['urgency'])) {
            $query->where('urgency', $filters['urgency']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->whereHas('consultation.patient', function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%");
            });
        }

        $query->orderByRaw("FIELD(urgency, 'urgente', 'normale')")
              ->orderBy('created_at', 'asc');

        return $query->paginate($filters['per_page'] ?? 15);
    }
}
