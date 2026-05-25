<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Modules\Auth\Models\User;
use App\Modules\ClinicalCore\Concerns\BelongsToEstablishment;

class Service extends Model
{
    use BelongsToEstablishment;

    protected $fillable = [
        'name',
        'is_active',
        'chief_id',
        'medical_chief_id',
        'service_type_id',
        'max_duration',
        'establishment_id',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function chief(): BelongsTo
    {
        return $this->belongsTo(User::class, 'chief_id');
    }

    public function medicalChief(): BelongsTo
    {
        return $this->belongsTo(User::class, 'medical_chief_id');
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(ServiceType::class, 'service_type_id');
    }

    /**
     * A service is the top of the clinical tree: it owns one or more units.
     */
    public function units(): HasMany
    {
        return $this->hasMany(EstablishmentUnit::class);
    }

    public function admissions(): HasMany
    {
        return $this->hasMany(Admission::class);
    }

    /**
     * One-to-one relationship with geolocation.
     */
    public function geolocation(): HasOne
    {
        return $this->hasOne(ServiceGeolocation::class);
    }

    /**
     * Accessor for latitude (for backward compatibility).
     */
    public function getLatitudeAttribute(): ?float
    {
        return $this->geolocation?->latitude;
    }

    /**
     * Accessor for longitude (for backward compatibility).
     */
    public function getLongitudeAttribute(): ?float
    {
        return $this->geolocation?->longitude;
    }
}
