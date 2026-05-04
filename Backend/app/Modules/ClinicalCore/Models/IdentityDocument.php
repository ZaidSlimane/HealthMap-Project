<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IdentityDocument extends Model
{
    protected $fillable = ['type', 'number'];

    public function companions(): HasMany
    {
        return $this->hasMany(Companion::class, 'identity_document_id');
    }
}
