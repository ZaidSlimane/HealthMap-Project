<?php

namespace App\Modules\Radiology\Services;

use App\Modules\Radiology\Models\RadioDemande;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RadioRequestService
{
    /**
     * Create one RadioDemande per exam type ID.
     *
     * @param array $data Must contain 'radiology_exam_type_ids', 'consultation_id', 'urgency', 'notes' (optional)
     * @return Collection Collection of created RadioDemande records
     */
    public function createRequest(array $data): Collection
    {
        return DB::transaction(function () use ($data) {
            $created = collect();

            foreach ($data['radiology_exam_type_ids'] as $examTypeId) {
                $demande = RadioDemande::create([
                    'consultation_id' => $data['consultation_id'] ?? null,
                    'admission_id' => $data['admission_id'] ?? null,
                    'radiology_exam_type_id' => $examTypeId,
                    'urgency' => $data['urgency'] ?? 'normale',
                    'status' => 'pending',
                    'notes' => $data['notes'] ?? null,
                    'requested_by' => Auth::id(),
                ]);

                $created->push($demande);
            }

            return $created;
        });
    }

    /**
     * Get all RadioDemande records for a consultation with examType and resultat eager-loaded.
     */
    public function getForConsultation(int $consultationId): Collection
    {
        return RadioDemande::where('consultation_id', $consultationId)
            ->with(['examType', 'resultat'])
            ->get();
    }

    /**
     * Cancel a pending RadioDemande. Aborts with 422 if not pending.
     */
    public function cancel(int $id): RadioDemande
    {
        $demande = RadioDemande::findOrFail($id);

        if ($demande->status !== 'pending') {
            abort(422, 'Only pending requests can be cancelled.');
        }

        $demande->update([
            'status' => 'cancelled',
        ]);

        return $demande->fresh();
    }
}
