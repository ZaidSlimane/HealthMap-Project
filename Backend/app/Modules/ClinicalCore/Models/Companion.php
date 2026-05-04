<?php

namespace App\Modules\ClinicalCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\ClinicalCore\Concerns\BelongsToEstablishment;

class Companion extends Model
{
    use BelongsToEstablishment;

    protected $fillable = ['name', 'first_name', 'address', 'phone', 'identity_document_id', 'establishment_id'];

    public function identityDocument(): BelongsTo
    {
        return $this->belongsTo(IdentityDocument::class, 'identity_document_id');
    }
}
