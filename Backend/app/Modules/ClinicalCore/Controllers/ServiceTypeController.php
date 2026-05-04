<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Modules\ClinicalCore\Models\ServiceType;

class ServiceTypeController extends BaseResourceController
{
    protected string $modelClass = ServiceType::class;
}
