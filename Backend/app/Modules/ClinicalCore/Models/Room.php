<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Modules\ClinicalCore\Concerns\BelongsToEstablishment;

/**
 * A physical room inside a clinical unit. Owns beds.
 *
 * `type` is a free-form label (Chambre, Box, Salle de réveil, …) and
 * `capacity` is the planned number of beds for the room — the actual
 * number of `beds` rows attached can be less or temporarily more.
 */
class Room extends Model
{
    use BelongsToEstablishment;

    protected $fillable = [
        'establishment_unit_id',
        'name',
        'type',
        'capacity',
        'establishment_id',
    ];

    protected function casts(): array
    {
        return ['capacity' => 'integer'];
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(EstablishmentUnit::class, 'establishment_unit_id');
    }

    public function beds(): HasMany
    {
        return $this->hasMany(Bed::class);
    }
}
