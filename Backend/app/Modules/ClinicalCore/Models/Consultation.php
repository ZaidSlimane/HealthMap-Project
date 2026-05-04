<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Modules\Auth\Models\User;
use App\Modules\ClinicalCore\Concerns\BelongsToEstablishment;

class Consultation extends Model
{
    use BelongsToEstablishment;

    protected $fillable = ['patient_id', 'user_id', 'admission_id', 'consultation_date', 'notes', 'establishment_id'];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function admission(): BelongsTo
    {
        return $this->belongsTo(Admission::class);
    }

    public function symptoms(): HasMany
    {
        return $this->hasMany(ConsultationSymptom::class);
    }
}
