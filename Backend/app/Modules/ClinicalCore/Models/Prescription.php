<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Modules\Auth\Models\User;
use App\Modules\ClinicalCore\Concerns\BelongsToEstablishment;

class Prescription extends Model
{
    use BelongsToEstablishment;

    protected $fillable = ['consultation_id', 'user_id', 'prescription_date', 'notes', 'establishment_id'];

    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function medications(): HasMany
    {
        return $this->hasMany(PrescriptionMedication::class);
    }
}
