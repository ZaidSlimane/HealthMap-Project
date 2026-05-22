<?php

namespace App\Modules\Laboratory\Services;

use App\Modules\Laboratory\Models\LaboDemande;
use App\Modules\Laboratory\Models\LaboDemandeItem;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class LaboRequestService
{
    /**
     * Create a LaboDemande with associated LaboDemandeItem rows.
     *
     * @param array $data Must contain 'consultation_id', 'urgency', 'notes' (optional), 'items' (array of ['item_type', 'item_id'])
     * @return LaboDemande The created demande with items loaded
     */
    public function createRequest(array $data): LaboDemande
    {
        return DB::transaction(function () use ($data) {
            $demande = LaboDemande::create([
                'consultation_id' => $data['consultation_id'] ?? null,
                'admission_id' => $data['admission_id'] ?? null,
                'urgency' => $data['urgency'] ?? 'normale',
                'status' => 'pending',
                'notes' => $data['notes'] ?? null,
                'requested_by' => Auth::id(),
            ]);

            foreach ($data['items'] as $item) {
                LaboDemandeItem::create([
                    'labo_demande_id' => $demande->id,
                    'item_type' => $item['item_type'],
                    'item_id' => $item['item_id'],
                ]);
            }

            return $demande->load('items');
        });
    }

    /**
     * Get all LaboDemande records for a consultation with items eager-loaded.
     */
    public function getForConsultation(int $consultationId): Collection
    {
        return LaboDemande::where('consultation_id', $consultationId)
            ->with('items')
            ->get();
    }

    /**
     * Cancel a pending LaboDemande. Aborts with 422 if not pending.
     */
    public function cancel(int $id): LaboDemande
    {
        $demande = LaboDemande::findOrFail($id);

        if ($demande->status !== 'pending') {
            abort(422, 'Only pending requests can be cancelled.');
        }

        $demande->update([
            'status' => 'cancelled',
        ]);

        return $demande->fresh();
    }
}
