<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\Auth\Models\User;

class VitalSign extends Model
{
    protected $fillable = [
        'vital_sign_type_id',
        'admission_id',
        'patient_id',
        'value',
        'measured_at',
        'measured_by',
    ];

    protected function casts(): array
    {
        return [
            'value'       => 'float',
            'measured_at' => 'datetime',
        ];
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(VitalSignType::class, 'vital_sign_type_id');
    }

    public function admission(): BelongsTo
    {
        return $this->belongsTo(Admission::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function measuredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'measured_by');
    }
}
