<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Modules\ClinicalCore\Models\Bed;

class BedController extends BaseResourceController
{
    protected string $modelClass = Bed::class;
}
