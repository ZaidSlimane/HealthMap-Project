<?php

namespace App\Modules\Pharmacy\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Pharmacy\Models\Produit;
use App\Modules\Pharmacy\Models\Commande;
use App\Modules\Pharmacy\Models\MouvementStock;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PharmacyDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        // KPIs
        $produitsEnStock = Produit::where('stock_actuel', '>', 0)->count();
        $alertesCritiques = Produit::whereColumn('stock_actuel', '<=', 'seuil_min')->count();
        $commandesEnAttente = Commande::where('statut', 'en_attente')->count();
        $valeurTotaleStock = Produit::sum(DB::raw('stock_actuel * COALESCE(prix_unitaire, 0)'));

        // Alert list - products below threshold
        $alertList = Produit::with('dci', 'fournisseur')
            ->whereColumn('stock_actuel', '<=', 'seuil_securite')
            ->orderByRaw('stock_actuel - seuil_min ASC')
            ->limit(10)
            ->get()
            ->map(function ($p) {
                $status = $p->stock_actuel <= $p->seuil_min ? 'critique' : 'alerte';
                return [
                    'id' => $p->id,
                    'nom_commercial' => $p->nom_commercial,
                    'dci' => $p->dci?->denomination,
                    'stock_actuel' => $p->stock_actuel,
                    'seuil_min' => $p->seuil_min,
                    'statut' => $status,
                ];
            });

        // Pending orders
        $pendingOrders = Commande::with('fournisseur')
            ->whereIn('statut', ['en_attente', 'confirmee'])
            ->orderBy('date_commande', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'reference' => $c->reference,
                    'fournisseur' => $c->fournisseur?->nom,
                    'date_commande' => $c->date_commande?->format('Y-m-d'),
                    'nb_produits' => $c->lignes()->count(),
                    'statut' => $c->statut,
                ];
            });

        // Recent movements
        $recentMovements = MouvementStock::with('produit')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'produit' => $m->produit?->nom_commercial,
                    'type' => $m->type,
                    'quantite' => $m->quantite,
                    'service_fournisseur' => $m->source_destination,
                    'date' => $m->created_at->format('Y-m-d H:i'),
                ];
            });

        return response()->json([
            'kpis' => [
                'produits_en_stock' => $produitsEnStock,
                'alertes_critiques' => $alertesCritiques,
                'commandes_en_attente' => $commandesEnAttente,
                'valeur_totale_stock' => round($valeurTotaleStock, 2),
            ],
            'alert_list' => $alertList,
            'pending_orders' => $pendingOrders,
            'recent_movements' => $recentMovements,
        ]);
    }
}
