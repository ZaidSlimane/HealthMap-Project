<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Modules\ClinicalCore\Models\PrescriptionMedication;

class PrescriptionMedicationController extends BaseResourceController
{
    protected string $modelClass = PrescriptionMedication::class;
}
