<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Modules\ClinicalCore\Concerns\BelongsToEstablishment;
use App\Modules\ChefService\Models\DoctorShiftAssignment;

class Borne extends Model
{
    use BelongsToEstablishment;

    protected $fillable = [
        'name', 'location', 'status', 'establishment_id',
        'label_fr', 'type', 'is_active', 'service_id',
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
        return $this->hasMany(DoctorShiftAssignment::class, 'borne_id')
            ->where('is_active', true);
    }

    public function assignedDoctor(): HasOne
    {
        return $this->hasOne(DoctorShiftAssignment::class, 'borne_id')
            ->where('is_active', true)
            ->latestOfMany()
            ->with('user:id,name,first_name');
    }
}
