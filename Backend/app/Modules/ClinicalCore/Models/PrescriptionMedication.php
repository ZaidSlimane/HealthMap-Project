<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\ClinicalCore\Concerns\BelongsToEstablishment;

class PrescriptionMedication extends Model
{
    use BelongsToEstablishment;

    protected $fillable = ['prescription_id', 'medication_name', 'dosage', 'frequency', 'duration', 'establishment_id'];

    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class);
    }
}
