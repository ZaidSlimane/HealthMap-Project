<?php

namespace App\Modules\Laboratory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Laboratory\Models\LaboDemande;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LaboReceptionController extends Controller
{
    /**
     * GET /laboratory/reception
     * Returns pending lab requests awaiting sample receipt.
     */
    public function index(Request $request): JsonResponse
    {
        $demandes = LaboDemande::whereIn('status', ['pending', 'in_progress'])
            ->whereNull('date_recep')
            ->with([
                'consultation.patient',
                'consultation.doctor',
                'consultation.admission',
                'requestedBy',
                'items',
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($demande) {
                return [
                    'id' => $demande->id,
                    'admission_number' => $demande->consultation?->admission?->id,
                    'patient' => $demande->consultation?->patient ? [
                        'nom' => $demande->consultation->patient->nom,
                        'prenom' => $demande->consultation->patient->prenom,
                    ] : null,
                    'service' => $demande->consultation?->admission?->service ?? null,
                    'doctor' => $demande->consultation?->doctor ? [
                        'name' => $demande->consultation->doctor->name,
                    ] : null,
                    'requested_at' => $demande->created_at,
                    'requested_by' => $demande->requestedBy ? [
                        'name' => $demande->requestedBy->name,
                    ] : null,
                    'urgency' => $demande->urgency,
                    'status' => $demande->status,
                    'notes' => $demande->notes,
                    'items' => $demande->items,
                ];
            });

        return response()->json($demandes);
    }

    /**
     * PATCH /laboratory/reception/{id}/receive
     * Marks a sample as received by setting date_recep = now() on the labo_demande record.
     * Also updates the status to 'in_progress' if it was 'pending'.
     */
    public function receive(int $id): JsonResponse
    {
        $demande = LaboDemande::findOrFail($id);

        $demande->date_recep = now();

        if ($demande->status === 'pending') {
            $demande->status = 'in_progress';
        }

        $demande->save();

        return response()->json([
            'message' => 'Prélèvement reçu avec succès.',
            'demande' => $demande->fresh([
                'consultation.patient',
                'consultation.doctor',
            ]),
        ]);
    }
}
