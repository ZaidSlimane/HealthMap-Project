<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Modules\ClinicalCore\Models\Country;

class CountryController extends BaseResourceController
{
    protected string $modelClass = Country::class;
}
