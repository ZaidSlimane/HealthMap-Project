<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Modules\ClinicalCore\Concerns\BelongsToEstablishment;

class WaitingList extends Model
{
    use BelongsToEstablishment;

    protected $fillable = [
        'patient_id', 'service_id', 'box_id', 'priority', 'added_at',
        'status', 'called_at', 'consultation_at', 'called_count',
        'establishment_id',
    ];

    protected function casts(): array
    {
        return [
            'added_at' => 'datetime',
            'called_at' => 'datetime',
            'consultation_at' => 'datetime',
            'called_count' => 'integer',
        ];
    }

    public const STATUSES = ['waiting', 'called', 'en_consultation', 'rappele', 'absent', 'completed'];
    public const PRIORITIES = ['red', 'orange', 'green'];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function triage(): HasOne
    {
        return $this->hasOne(Triage::class);
    }

    public function consultation(): HasOne
    {
        return $this->hasOne(Consultation::class);
    }
}
