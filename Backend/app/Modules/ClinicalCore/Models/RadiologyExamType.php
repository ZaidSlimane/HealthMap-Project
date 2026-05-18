<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;

class RadiologyExamType extends Model
{
    protected $fillable = ['label', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }
}
