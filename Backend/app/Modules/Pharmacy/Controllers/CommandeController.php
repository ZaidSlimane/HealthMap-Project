<?php

namespace App\Modules\Pharmacy\Controllers;

use App\Modules\Pharmacy\Models\Commande;
use App\Modules\Pharmacy\Models\LigneCommande;
use App\Modules\Pharmacy\Models\Produit;
use App\Modules\Pharmacy\Models\MouvementStock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CommandeController
{
    public function index(Request $request): JsonResponse
    {
        $query = Commande::with('fournisseur', 'lignes.produit');

        if ($statut = $request->query('statut')) {
            $query->where('statut', $statut);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhereHas('fournisseur', fn($fq) => $fq->where('nom', 'like', "%{$search}%"));
            });
        }

        $commandes = $query->orderBy('date_commande', 'desc')->paginate($request->query('per_page', 20));

        return response()->json($commandes);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'fournisseur_id' => 'required|exists:fournisseurs,id',
            'date_commande' => 'required|date',
            'notes' => 'nullable|string',
            'lignes' => 'required|array|min:1',
            'lignes.*.produit_id' => 'required|exists:produits,id',
            'lignes.*.qte_commandee' => 'required|integer|min:1',
            'lignes.*.prix_unitaire' => 'nullable|numeric',
        ]);

        $commande = DB::transaction(function () use ($data, $request) {
            $commande = Commande::create([
                'fournisseur_id' => $data['fournisseur_id'],
                'date_commande' => $data['date_commande'],
                'notes' => $data['notes'] ?? null,
                'created_by' => Auth::id(),
            ]);

            foreach ($data['lignes'] as $ligne) {
                $commande->lignes()->create([
                    'produit_id' => $ligne['produit_id'],
                    'qte_commandee' => $ligne['qte_commandee'],
                    'qte_recue' => 0,
                    'prix_unitaire' => $ligne['prix_unitaire'] ?? null,
                ]);
            }

            return $commande;
        });

        return response()->json($commande->load('fournisseur', 'lignes.produit'), 201);
    }

    public function show(int $id): JsonResponse
    {
        $commande = Commande::with('fournisseur', 'lignes.produit.dci', 'creator')->findOrFail($id);
        return response()->json($commande);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $commande = Commande::findOrFail($id);

        $data = $request->validate([
            'statut' => 'sometimes|in:en_attente,confirmee,recue',
            'notes' => 'nullable|string',
        ]);

        $commande->update($data);
        return response()->json($commande->fresh(['fournisseur', 'lignes.produit']));
    }

    public function receive(Request $request, int $id): JsonResponse
    {
        $commande = Commande::findOrFail($id);

        $data = $request->validate([
            'lignes' => 'required|array',
            'lignes.*.id' => 'required|exists:ligne_commande,id',
            'lignes.*.qte_recue' => 'required|integer|min:0',
            'lignes.*.lot' => 'nullable|string',
            'lignes.*.date_expiration' => 'nullable|date',
        ]);

        $result = DB::transaction(function () use ($commande, $data) {
            $allReceived = true;

            foreach ($data['lignes'] as $ligneData) {
                $ligne = LigneCommande::find($ligneData['id']);
                $ligne->update([
                    'qte_recue' => $ligneData['qte_recue'],
                    'lot' => $ligneData['lot'] ?? null,
                    'date_expiration' => $ligneData['date_expiration'] ?? null,
                ]);

                // Create stock movement if quantity received
                if ($ligneData['qte_recue'] > 0) {
                    $produit = Produit::find($ligne->produit_id);
                    $stockAvant = $produit->stock_actuel;
                    $stockApres = $stockAvant + $ligneData['qte_recue'];

                    $produit->update(['stock_actuel' => $stockApres]);

                    MouvementStock::create([
                        'produit_id' => $produit->id,
                        'type' => 'entree',
                        'quantite' => $ligneData['qte_recue'],
                        'stock_avant' => $stockAvant,
                        'stock_apres' => $stockApres,
                        'reference' => $commande->reference,
                        'source_destination' => $commande->fournisseur?->nom,
                        'commande_id' => $commande->id,
                        'user_id' => Auth::id(),
                    ]);
                }

                if ($ligne->qte_recue < $ligne->qte_commandee) {
                    $allReceived = false;
                }
            }

            // Update order status
            $commande->update([
                'statut' => $allReceived ? 'recue' : 'recue',
            ]);

            return $commande;
        });

        return response()->json($result->load('fournisseur', 'lignes.produit'));
    }

    public function destroy(int $id): JsonResponse
    {
        $commande = Commande::findOrFail($id);
        
        if ($commande->statut !== 'en_attente') {
            return response()->json(['message' => 'Cannot delete a confirmed or received order'], 400);
        }

        $commande->delete();
        return response()->json(null, 204);
    }
}
