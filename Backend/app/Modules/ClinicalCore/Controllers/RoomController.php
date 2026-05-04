<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Modules\ClinicalCore\Models\Room;

class RoomController extends BaseResourceController
{
    protected string $modelClass = Room::class;

    protected array $with = ['unit', 'beds'];
}
