<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Province extends Model
{
    protected $fillable = ['code', 'name'];

    protected $casts = [
        'code' => 'integer',
    ];

    public function municipalities(): HasMany
    {
        return $this->hasMany(Municipality::class, 'province_id');
    }

    public function establishments(): HasMany
    {
        return $this->hasMany(Establishment::class, 'province_id');
    }
}
