<?php

namespace App\Modules\ClinicalCore\Models;

use App\Modules\Auth\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Establishment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'slug',
        'name',
        'name_ar',
        'establishment_type_id',
        'province_id',
        'municipality_id',
        'address',
        'phone',
        'fax',
        'email',
        'directeur',
        'source',
        'status',
        'created_by',
        'admin_user_id',
    ];

    public function type(): BelongsTo
    {
        return $this->belongsTo(EstablishmentType::class, 'establishment_type_id');
    }

    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class);
    }

    public function municipality(): BelongsTo
    {
        return $this->belongsTo(Municipality::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * The dedicated admin account created for this establishment during the
     * onboarding wizard. Acts as the canonical "owner" for the tenant.
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }

    // ----- Tenant-scoped data (read-only convenience accessors) -----

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function establishmentUnits(): HasMany
    {
        return $this->hasMany(EstablishmentUnit::class);
    }

    public function beds(): HasMany
    {
        return $this->hasMany(Bed::class);
    }

    public function bornes(): HasMany
    {
        return $this->hasMany(Borne::class);
    }

    public function patients(): HasMany
    {
        return $this->hasMany(Patient::class);
    }

    public function admissions(): HasMany
    {
        return $this->hasMany(Admission::class);
    }

    public function consultations(): HasMany
    {
        return $this->hasMany(Consultation::class);
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class);
    }

    public function medicalDocuments(): HasMany
    {
        return $this->hasMany(MedicalDocument::class);
    }

    public function observations(): HasMany
    {
        return $this->hasMany(Observation::class);
    }

    public function waitingLists(): HasMany
    {
        return $this->hasMany(WaitingList::class);
    }
}
