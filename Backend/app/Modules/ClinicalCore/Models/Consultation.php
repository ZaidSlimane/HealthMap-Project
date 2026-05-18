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

    protected $fillable = [
        'patient_id', 'user_id', 'box_id', 'admission_id', 'consultation_date', 'notes',
        'motif', 'anamnese', 'examen_clinique', 'compte_rendu', 'diagnostic',
        'cim10_code', 'status', 'waiting_list_id', 'started_at', 'completed_at',
        'establishment_id',
    ];

    protected function casts(): array
    {
        return [
            'consultation_date' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public const STATUSES = ['in_progress', 'completed', 'recalled', 'observation', 'admitted'];

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

    public function waitingList(): BelongsTo
    {
        return $this->belongsTo(WaitingList::class);
    }

    public function symptoms(): HasMany
    {
        return $this->hasMany(ConsultationSymptom::class);
    }
}
