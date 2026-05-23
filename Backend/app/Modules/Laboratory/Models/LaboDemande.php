<?php

namespace App\Modules\Laboratory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Modules\ClinicalCore\Models\Consultation;
use App\Modules\Auth\Models\User;

class LaboDemande extends Model
{
    protected $table = 'labo_demande';

    protected $fillable = [
        'consultation_id',
        'admission_id',
        'urgency',
        'status',
        'notes',
        'requested_by',
        'date_recep',
    ];

    protected function casts(): array
    {
        return [
            'date_recep' => 'datetime',
        ];
    }

    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(LaboDemandeItem::class, 'labo_demande_id');
    }

    public function results(): HasMany
    {
        return $this->hasMany(LaboResult::class, 'labo_demande_id');
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
