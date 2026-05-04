<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaritalStatus extends Model
{
    protected $fillable = ['label'];

    public function patients(): HasMany
    {
        return $this->hasMany(Patient::class, 'marital_status_id');
    }
}
