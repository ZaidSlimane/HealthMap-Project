<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\ClinicalCore\Concerns\BelongsToEstablishment;

class Admission extends Model
{
    use BelongsToEstablishment;

    public const MODES = ['normale', 'urgence', 'programmee'];

    public const STATUSES = ['pending', 'active', 'discharged', 'cancelled'];

    protected $fillable = [
        'patient_id',
        'service_id',
        'bed_id',
        'companion_id',
        'date_admission',
        'date_sortie',
        'motif_admission',
        'mode',
        'status',
        'establishment_id',
    ];

    protected function casts(): array
    {
        return [
            'date_admission' => 'datetime',
            'date_sortie'    => 'datetime',
        ];
    }

    /**
     * Keep bed.status in lockstep with the admission lifecycle.
     *
     *   - Creating an active admission with a bed → bed becomes 'occupied'.
     *   - Saving with a date_sortie set or status moved to 'discharged'/
     *     'cancelled' → bed becomes 'free'.
     *   - Re-assigning a bed mid-stay → old bed freed, new bed occupied.
     */
    protected static function booted(): void
    {
        static::saved(function (self $admission) {
            $admission->syncBedStatus();
        });

        static::deleted(function (self $admission) {
            if ($admission->bed_id) {
                Bed::query()->whereKey($admission->bed_id)->update(['status' => 'free']);
            }
        });
    }

    protected function syncBedStatus(): void
    {
        $original = $this->getOriginal('bed_id');

        // If a bed was swapped, free the previous one.
        if ($original && $original !== $this->bed_id) {
            Bed::query()->whereKey($original)->update(['status' => 'free']);
        }

        if (!$this->bed_id) {
            return;
        }

        $isClosed = $this->date_sortie !== null
            || in_array($this->status, ['discharged', 'cancelled'], true);

        Bed::query()
            ->whereKey($this->bed_id)
            ->update(['status' => $isClosed ? 'free' : 'occupied']);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function bed(): BelongsTo
    {
        return $this->belongsTo(Bed::class);
    }

    public function companion(): BelongsTo
    {
        return $this->belongsTo(Companion::class);
    }
}
