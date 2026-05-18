<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\Auth\Models\User;
use App\Modules\ClinicalCore\Concerns\BelongsToEstablishment;

class Triage extends Model
{
    use BelongsToEstablishment;

    protected $fillable = [
        'waiting_list_id', 'user_id', 'patient_id', 'establishment_id',
        'temperature', 'tension_sys', 'tension_dia', 'heart_rate', 'spo2',
        'weight', 'pain_score', 'urgency_level', 'orientation',
        'symptoms', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'temperature' => 'decimal:1',
            'tension_sys' => 'integer',
            'tension_dia' => 'integer',
            'heart_rate' => 'integer',
            'spo2' => 'integer',
            'weight' => 'integer',
            'pain_score' => 'integer',
            'symptoms' => 'array',
        ];
    }

    public function waitingList(): BelongsTo
    {
        return $this->belongsTo(WaitingList::class);
    }

    public function nurse(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }
}
