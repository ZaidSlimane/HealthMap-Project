<?php

namespace App\Modules\Pharmacy\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Dci extends Model
{
    protected $table = 'dci';

    protected $fillable = [
        'code',
        'denomination',
        'classification',
        'classe_therapeutique',
    ];

    protected function casts(): array
    {
        return [
            'classification' => 'string',
        ];
    }

    public function produits(): HasMany
    {
        return $this->hasMany(Produit::class, 'dci_id');
    }
}
