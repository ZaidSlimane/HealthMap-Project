<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EstablishmentType extends Model
{
    protected $fillable = ['code', 'label'];

    public function units(): HasMany
    {
        return $this->hasMany(EstablishmentUnit::class, 'establishment_type_id');
    }

    public function establishments(): HasMany
    {
        return $this->hasMany(Establishment::class, 'establishment_type_id');
    }
}
