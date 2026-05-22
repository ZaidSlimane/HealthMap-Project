<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientMovement extends Model
{
    protected $fillable = [
        'patient_id', 'admission_id', 'bed_id',
        'moved_at', 'left_at', 'reason',
    ];

    protected function casts(): array
    {
        return [
            'moved_at' => 'datetime',
            'left_at' => 'datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function admission(): BelongsTo
    {
        return $this->belongsTo(Admission::class);
    }

    public function bed(): BelongsTo
    {
        return $this->belongsTo(Bed::class);
    }
}
