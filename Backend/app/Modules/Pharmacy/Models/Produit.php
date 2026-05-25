<?php

namespace App\Modules\Pharmacy\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Produit extends Model
{
    protected $table = 'produits';

    protected $fillable = [
        'code_nomenclature',
        'nom_commercial',
        'dci_id',
        'fournisseur_id',
        'forme',
        'dosage',
        'unite',
        'stock_actuel',
        'seuil_min',
        'seuil_securite',
        'prix_unitaire',
        'is_psychotrope',
        'is_stupefiant',
    ];

    protected function casts(): array
    {
        return [
            'stock_actuel' => 'integer',
            'seuil_min' => 'integer',
            'seuil_securite' => 'integer',
            'prix_unitaire' => 'decimal:2',
            'is_psychotrope' => 'boolean',
            'is_stupefiant' => 'boolean',
        ];
    }

    public function dci(): BelongsTo
    {
        return $this->belongsTo(Dci::class, 'dci_id');
    }

    public function fournisseur(): BelongsTo
    {
        return $this->belongsTo(Fournisseur::class, 'fournisseur_id');
    }

    public function mouvements(): HasMany
    {
        return $this->hasMany(MouvementStock::class, 'produit_id');
    }

    public function lignesCommande(): HasMany
    {
        return $this->hasMany(LigneCommande::class, 'produit_id');
    }

    /**
     * Get stock status: 'critique', 'alerte', or 'ok'
     */
    public function getStockStatusAttribute(): string
    {
        if ($this->stock_actuel <= $this->seuil_min) {
            return 'critique';
        }
        if ($this->stock_actuel <= $this->seuil_securite) {
            return 'alerte';
        }
        return 'ok';
    }
}
