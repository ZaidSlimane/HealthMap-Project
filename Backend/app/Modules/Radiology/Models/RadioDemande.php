<?php

namespace App\Modules\Radiology\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Modules\ClinicalCore\Models\Consultation;
use App\Modules\ClinicalCore\Models\RadiologyExamType;
use App\Modules\Auth\Models\User;

class RadioDemande extends Model
{
    protected $table = 'radio_demande';

    protected $fillable = [
        'consultation_id',
        'admission_id',
        'radiology_exam_type_id',
        'urgency',
        'status',
        'scheduled_at',
        'notes',
        'requested_by',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
    ];

    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }

    public function examType(): BelongsTo
    {
        return $this->belongsTo(RadiologyExamType::class, 'radiology_exam_type_id');
    }

    public function resultat(): HasOne
    {
        return $this->hasOne(RadioResultat::class, 'radio_demande_id');
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
