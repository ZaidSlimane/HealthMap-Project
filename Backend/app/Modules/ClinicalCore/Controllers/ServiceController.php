<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Modules\ClinicalCore\Models\Service;

class ServiceController extends BaseResourceController
{
    protected string $modelClass = Service::class;

    protected array $with = ['chief', 'medicalChief', 'units.rooms.beds'];
}
