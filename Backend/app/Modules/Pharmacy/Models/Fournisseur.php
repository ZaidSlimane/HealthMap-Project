<?php

namespace App\Modules\Pharmacy\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Fournisseur extends Model
{
    protected $table = 'fournisseurs';

    protected $fillable = [
        'nom',
        'type',
        'contact',
        'email',
        'telephone',
        'adresse',
    ];

    protected function casts(): array
    {
        return [
            'type' => 'string',
        ];
    }

    public function produits(): HasMany
    {
        return $this->hasMany(Produit::class, 'fournisseur_id');
    }

    public function commandes(): HasMany
    {
        return $this->hasMany(Commande::class, 'fournisseur_id');
    }
}
