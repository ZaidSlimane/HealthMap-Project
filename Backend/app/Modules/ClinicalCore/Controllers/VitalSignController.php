<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Modules\ClinicalCore\Models\VitalSign;
use App\Modules\ClinicalCore\Requests\StoreVitalSignRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VitalSignController extends BaseResourceController
{
    protected string $modelClass = VitalSign::class;

    protected array $with = ['type', 'admission', 'patient'];

    protected ?string $storeRequest = StoreVitalSignRequest::class;

    public function index(Request $request): JsonResponse
    {
        $query = VitalSign::query()->with($this->with);

        if ($request->has('admission_id')) {
            $query->where('admission_id', $request->input('admission_id'));
        }

        if ($request->has('vital_sign_type_id')) {
            $query->where('vital_sign_type_id', $request->input('vital_sign_type_id'));
        }

        $query->orderBy('measured_at', 'desc');

        return response()->json($query->paginate($request->input('per_page', 50)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = app(StoreVitalSignRequest::class)->validated();

        // Default measured_at to now if not provided
        if (empty($data['measured_at'])) {
            $data['measured_at'] = now();
        }

        // Set measured_by to the authenticated user
        $data['measured_by'] = $request->user()->id;

        // If patient_id not provided, resolve it from the admission
        if (empty($data['patient_id'])) {
            $admission = \App\Modules\ClinicalCore\Models\Admission::findOrFail($data['admission_id']);
            $data['patient_id'] = $admission->patient_id;
        }

        $vitalSign = VitalSign::create($data);

        return response()->json($vitalSign->load($this->with), 201);
    }
}
