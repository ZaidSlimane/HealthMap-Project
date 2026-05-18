<?php

namespace App\Modules\ChefService\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\Auth\Models\User;
use App\Modules\ClinicalCore\Models\Borne;
use App\Modules\ClinicalCore\Models\Service;

class DoctorShiftAssignment extends Model
{
    protected $fillable = [
        'user_id', 'service_id', 'borne_id', 'box_id',
        'day_of_week', 'start_time', 'end_time',
        'assigned_by', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'day_of_week' => 'array',
            'is_active' => 'boolean',
            'start_time' => 'datetime:H:i',
            'end_time' => 'datetime:H:i',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function borne(): BelongsTo
    {
        return $this->belongsTo(Borne::class);
    }

    public function box(): BelongsTo
    {
        return $this->belongsTo(Box::class);
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
