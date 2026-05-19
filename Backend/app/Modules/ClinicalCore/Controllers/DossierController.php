<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ClinicalCore\Models\Admission;
use App\Modules\ClinicalCore\Models\VitalSign;
use Illuminate\Http\JsonResponse;

class DossierController extends Controller
{
    /**
     * Return the aggregated dossier for a given admission.
     *
     * Eager-loads: patient, service, bed.room.unit, companion, companions
     * (all companions linked to admissions of the same patient),
     * latestVitalSigns (most recent measurement per type), and
     * admissionHistory (all admissions for the same patient).
     */
    public function show(int $id): JsonResponse
    {
        $admission = Admission::with([
            'patient',
            'service',
            'bed.room.unit',
            'companion',
        ])->findOrFail($id);

        // All companions linked to any admission of the same patient
        $companions = Admission::where('patient_id', $admission->patient_id)
            ->whereNotNull('companion_id')
            ->with('companion')
            ->get()
            ->pluck('companion')
            ->unique('id')
            ->values();

        // Most recent vital sign per type for this admission
        $latestVitalSigns = VitalSign::where('admission_id', $admission->id)
            ->with('type')
            ->get()
            ->groupBy('vital_sign_type_id')
            ->map(fn ($signs) => $signs->sortByDesc('measured_at')->first())
            ->values();

        // All admissions for the same patient (history)
        $admissionHistory = Admission::where('patient_id', $admission->patient_id)
            ->with('service')
            ->orderByDesc('date_admission')
            ->get();

        return response()->json([
            'admission'        => $admission,
            'patient'          => $admission->patient,
            'service'          => $admission->service,
            'bed'              => $admission->bed?->load('room.unit'),
            'companion'        => $admission->companion,
            'companions'       => $companions,
            'latestVitalSigns' => $latestVitalSigns,
            'admissionHistory' => $admissionHistory,
        ]);
    }
}
