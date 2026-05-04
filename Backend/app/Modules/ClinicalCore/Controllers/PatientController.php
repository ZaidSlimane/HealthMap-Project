<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Modules\ClinicalCore\Models\Patient;
use App\Modules\ClinicalCore\Requests\StorePatientRequest;
use App\Modules\ClinicalCore\Requests\UpdatePatientRequest;

class PatientController extends BaseResourceController
{
    protected string $modelClass = Patient::class;

    protected array $with = ['nationality', 'maritalStatus', 'birthPlace'];

    protected ?string $storeRequest = StorePatientRequest::class;

    protected ?string $updateRequest = UpdatePatientRequest::class;
}
