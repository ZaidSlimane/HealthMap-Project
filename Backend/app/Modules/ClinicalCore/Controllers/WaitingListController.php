<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Modules\ClinicalCore\Models\WaitingList;

class WaitingListController extends BaseResourceController
{
    protected string $modelClass = WaitingList::class;
}
