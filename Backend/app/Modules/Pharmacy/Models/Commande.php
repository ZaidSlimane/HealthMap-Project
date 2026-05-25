<?php

namespace App\Modules\Pharmacy\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Commande extends Model
{
    protected $table = 'commandes';

    protected $fillable = [
        'reference',
        'fournisseur_id',
        'date_commande',
        'statut',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'date_commande' => 'date',
            'statut' => 'string',
        ];
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($commande) {
            if (empty($commande->reference)) {
                $commande->reference = 'CMD-' . date('Ymd') . '-' . str_pad(static::count() + 1, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    public function fournisseur(): BelongsTo
    {
        return $this->belongsTo(Fournisseur::class, 'fournisseur_id');
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(LigneCommande::class, 'commande_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Auth\Models\User::class, 'created_by');
    }

    public function mouvements(): HasMany
    {
        return $this->hasMany(MouvementStock::class, 'commande_id');
    }
}
