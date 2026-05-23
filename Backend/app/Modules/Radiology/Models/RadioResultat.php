<?php

namespace App\Modules\Radiology\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\Auth\Models\User;

class RadioResultat extends Model
{
    protected $table = 'radio_resultat';

    protected $fillable = [
        'radio_demande_id',
        'file_path',
        'file_uploaded_at',
        'compte_rendu',
        'performed_by',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'file_uploaded_at' => 'datetime',
        ];
    }

    public function demande(): BelongsTo
    {
        return $this->belongsTo(RadioDemande::class, 'radio_demande_id');
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
