<?php

namespace App\Modules\Laboratory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\Auth\Models\User;

class LaboResult extends Model
{
    protected $table = 'labo_result';

    protected $fillable = [
        'labo_demande_id',
        'labo_demande_item_id',
        'sub_analysis_name',
        'numeric_value',
        'text_value',
        'unit',
        'reference_range',
        'performed_by',
    ];

    protected function casts(): array
    {
        return [
            'numeric_value' => 'decimal:4',
        ];
    }

    public function demande(): BelongsTo
    {
        return $this->belongsTo(LaboDemande::class, 'labo_demande_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(LaboDemandeItem::class, 'labo_demande_item_id');
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
