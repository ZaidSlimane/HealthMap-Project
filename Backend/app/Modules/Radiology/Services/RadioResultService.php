<?php

namespace App\Modules\Radiology\Services;

use App\Modules\Radiology\Models\RadioDemande;
use App\Modules\Radiology\Models\RadioResultat;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RadioResultService
{
    /**
     * Upload a result file and create/update the RadioResultat record.
     * Sets the associated demande status to 'completed'.
     */
    public function uploadResult(int $demandeId, UploadedFile $file, ?string $compteRendu): RadioResultat
    {
        return DB::transaction(function () use ($demandeId, $file, $compteRendu) {
            $demande = RadioDemande::findOrFail($demandeId);

            $filePath = $file->store('radiology/results', 'private');

            $resultat = RadioResultat::updateOrCreate(
                ['radio_demande_id' => $demandeId],
                [
                    'file_path' => $filePath,
                    'compte_rendu' => $compteRendu,
                    'performed_by' => Auth::id(),
                    'status' => 'completed',
                    'file_uploaded_at' => now(),
                ]
            );

            $demande->update(['status' => 'completed']);

            return $resultat;
        });
    }

    /**
     * Get paginated worklist of RadioDemande with status pending/in_progress.
     * Filterable by date, urgency, and patient search.
     * Eager-loads examType, consultation.patient, requestedBy.
     */
    public function getWorklist(array $filters): LengthAwarePaginator
    {
        $query = RadioDemande::whereIn('status', ['pending', 'in_progress'])
            ->with(['examType', 'consultation.patient', 'requestedBy']);

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
