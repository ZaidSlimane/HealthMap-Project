<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\ClinicalCore\Concerns\BelongsToEstablishment;

class Bed extends Model
{
    use BelongsToEstablishment;

    protected $fillable = [
        'room_id',
        'bed_number',
        'status',
        'establishment_id',
    ];

    /**
     * In-memory defaults so create responses always include `status`,
     * matching the DB-level default of 'free'.
     */
    protected $attributes = [
        'status' => 'free',
    ];

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
