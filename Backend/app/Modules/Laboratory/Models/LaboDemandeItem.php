<?php

namespace App\Modules\Laboratory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LaboDemandeItem extends Model
{
    protected $table = 'labo_demande_item';

    protected $fillable = [
        'labo_demande_id',
        'item_type',
        'item_id',
        'status',
    ];

    public function demande(): BelongsTo
    {
        return $this->belongsTo(LaboDemande::class, 'labo_demande_id');
    }
}
