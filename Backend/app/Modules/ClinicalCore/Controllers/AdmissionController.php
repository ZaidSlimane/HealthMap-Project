<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Modules\ClinicalCore\Models\Admission;
use App\Modules\ClinicalCore\Requests\StoreAdmissionRequest;
use App\Modules\ClinicalCore\Requests\UpdateAdmissionRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdmissionController extends BaseResourceController
{
    protected string $modelClass = Admission::class;

    protected array $with = ['patient', 'service', 'bed.room.unit'];

    protected ?string $storeRequest = StoreAdmissionRequest::class;

    protected ?string $updateRequest = UpdateAdmissionRequest::class;

    public function index(Request $request): JsonResponse
    {
        $query = Admission::query()->with($this->with);

        if ($request->has('service_id')) {
            $query->where('service_id', $request->input('service_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $query->orderBy('date_admission', 'desc');

        return response()->json($query->paginate($request->input('per_page', 50)));
    }
}
