<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Modules\ClinicalCore\Concerns\BelongsToEstablishment;

/**
 * A clinical unit (sub-division of a Service). Owns rooms, which in turn
 * own beds. The optional `unit_type` mirrors the frontend's UnitType enum
 * (Admission Classique, Soins Intensifs, …).
 */
class EstablishmentUnit extends Model
{
    use BelongsToEstablishment;

    protected $fillable = [
        'service_id',
        'name',
        'unit_type',
        'establishment_id',
    ];

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }
}
