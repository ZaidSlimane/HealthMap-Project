<?php

namespace App\Modules\Pharmacy\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LigneCommande extends Model
{
    protected $table = 'ligne_commande';

    protected $fillable = [
        'commande_id',
        'produit_id',
        'qte_commandee',
        'qte_recue',
        'lot',
        'date_expiration',
        'prix_unitaire',
    ];

    protected function casts(): array
    {
        return [
            'qte_commandee' => 'integer',
            'qte_recue' => 'integer',
            'date_expiration' => 'date',
            'prix_unitaire' => 'decimal:2',
        ];
    }

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class, 'commande_id');
    }

    public function produit(): BelongsTo
    {
        return $this->belongsTo(Produit::class, 'produit_id');
    }
}
