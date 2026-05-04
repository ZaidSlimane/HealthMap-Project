<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    protected $fillable = ['code', 'alpha2', 'alpha3', 'name_ar', 'name_fr'];

    public function patients(): HasMany
    {
        return $this->hasMany(Patient::class, 'nationality_id');
    }
}
