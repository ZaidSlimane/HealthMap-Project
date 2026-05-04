<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceType extends Model
{
    protected $fillable = ['label'];

    public function services(): HasMany
    {
        return $this->hasMany(Service::class, 'service_type_id');
    }
}
