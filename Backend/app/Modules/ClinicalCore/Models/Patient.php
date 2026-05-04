<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Modules\ClinicalCore\Concerns\BelongsToEstablishment;

class Patient extends Model
{
    use BelongsToEstablishment;

    protected $fillable = [
        'patient_matricule', 'nin', 'name', 'first_name', 'first_name_ar', 'name_ar',
        'gender', 'date_of_birth', 'birth_place_id', 'father_first_name',
        'mother_name', 'mother_first_name', 'father_first_name_ar',
        'mother_name_ar', 'mother_first_name_ar', 'nationality_id',
        'marital_status_id', 'spouse_id', 'ins', 'establishment_id',
    ];

    /**
     * Auto-generate a per-establishment matricule when one is not supplied.
     *
     * Format: EST{est_id}-{YYYY}-{seq:5}, e.g. EST3-2026-00042. Sequence is
     * derived per establishment + year from the highest existing matricule
     * matching the prefix. Cheap, predictable, and human-readable; not
     * meant to be cryptographically unguessable.
     */
    protected static function booted(): void
    {
        static::creating(function (self $patient) {
            if (!empty($patient->patient_matricule)) {
                return;
            }

            $estId = $patient->establishment_id ?? 0;
            $year  = now()->format('Y');
            $prefix = "EST{$estId}-{$year}-";

            $last = static::query()
                ->withoutEstablishmentScope()
                ->where('patient_matricule', 'like', $prefix . '%')
                ->orderByDesc('patient_matricule')
                ->value('patient_matricule');

            $next = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;
            $patient->patient_matricule = $prefix . str_pad((string) $next, 5, '0', STR_PAD_LEFT);
        });
    }

    public function birthPlace(): BelongsTo
    {
        return $this->belongsTo(Municipality::class, 'birth_place_id');
    }

    public function nationality(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'nationality_id');
    }

    public function maritalStatus(): BelongsTo
    {
        return $this->belongsTo(MaritalStatus::class, 'marital_status_id');
    }

    public function spouse(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'spouse_id');
    }

    public function admissions(): HasMany
    {
        return $this->hasMany(Admission::class);
    }
}
