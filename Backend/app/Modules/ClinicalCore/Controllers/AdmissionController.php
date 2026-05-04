<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Modules\ClinicalCore\Models\Admission;
use App\Modules\ClinicalCore\Requests\StoreAdmissionRequest;
use App\Modules\ClinicalCore\Requests\UpdateAdmissionRequest;

class AdmissionController extends BaseResourceController
{
    protected string $modelClass = Admission::class;

    protected array $with = ['patient', 'service', 'bed', 'companion'];

    protected ?string $storeRequest = StoreAdmissionRequest::class;

    protected ?string $updateRequest = UpdateAdmissionRequest::class;
}
