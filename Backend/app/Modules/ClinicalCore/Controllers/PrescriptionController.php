<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Modules\ClinicalCore\Models\Prescription;

class PrescriptionController extends BaseResourceController
{
    protected string $modelClass = Prescription::class;
}
