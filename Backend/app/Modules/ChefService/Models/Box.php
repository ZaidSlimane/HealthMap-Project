<?php

namespace App\Modules\ChefService\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Modules\ClinicalCore\Models\Service;

class Box extends Model
{
    protected $fillable = [
        'name', 'label_fr', 'type', 'is_active',
        'service_id', 'establishment_id',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function activeAssignments(): HasMany
    {
        return $this->hasMany(DoctorShiftAssignment::class, 'box_id')
            ->where('is_active', true);
    }

    public function assignedDoctor(): HasOne
    {
        return $this->hasOne(DoctorShiftAssignment::class, 'box_id')
            ->where('is_active', true)
            ->latestOfMany()
            ->with('user:id,name,first_name');
    }
}
