<?php

namespace App\Modules\ClinicalCore\Models;

use App\Modules\Auth\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Poste extends Model
{
    protected $fillable = ['label', 'label_ar'];

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'poste_id');
    }
}
