<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Modules\ClinicalCore\Models\Consultation;

class ConsultationController extends BaseResourceController
{
    protected string $modelClass = Consultation::class;

    protected array $with = ['patient', 'doctor', 'admission', 'symptoms'];
}
