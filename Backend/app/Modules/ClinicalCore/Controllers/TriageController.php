<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Modules\ClinicalCore\Models\Triage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TriageController extends BaseResourceController
{
    protected string $modelClass = Triage::class;

    protected array $with = ['patient', 'nurse', 'waitingList'];

    /**
     * Override store to auto-assign user_id and establishment_id.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->only([
            'waiting_list_id', 'patient_id',
            'temperature', 'tension_sys', 'tension_dia', 'heart_rate', 'spo2',
            'weight', 'pain_score', 'urgency_level', 'orientation',
            'symptoms', 'notes',
        ]);

        $data['user_id'] = Auth::id();
        $data['establishment_id'] = Auth::user()?->establishment_id;

        $triage = Triage::create($data);

        return response()->json($triage->load($this->with), 201);
    }
}
