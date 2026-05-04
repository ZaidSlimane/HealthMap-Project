<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\ClinicalCore\Concerns\BelongsToEstablishment;

class ConsultationSymptom extends Model
{
    use BelongsToEstablishment;

    protected $fillable = ['consultation_id', 'symptom_name', 'severity', 'establishment_id'];

    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }
}
