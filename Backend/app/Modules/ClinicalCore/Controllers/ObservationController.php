<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Modules\ClinicalCore\Models\Observation;

class ObservationController extends BaseResourceController
{
    protected string $modelClass = Observation::class;
}
