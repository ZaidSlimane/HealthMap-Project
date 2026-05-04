<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\ClinicalCore\Concerns\BelongsToEstablishment;

class Borne extends Model
{
    use BelongsToEstablishment;

    protected $fillable = ['name', 'location', 'status', 'establishment_id'];
}
