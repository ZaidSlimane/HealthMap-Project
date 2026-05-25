<?php

namespace App\Modules\Pharmacy\Controllers;

use App\Modules\Pharmacy\Models\Produit;
use App\Modules\Pharmacy\Models\MouvementStock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StockController
{
    public function index(Request $request): JsonResponse
    {
        $query = Produit::with('dci', 'fournisseur');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nom_commercial', 'like', "%{$search}%")
                  ->orWhere('code_nomenclature', 'like', "%{$search}%")
                  ->orWhereHas('dci', fn($dq) => $dq->where('denomination', 'like', "%{$search}%"));
            });
        }

        $produits = $query->orderBy('nom_commercial')->paginate($request->query('per_page', 50));

        // Add computed status to each product
        $produits->getCollection()->transform(function ($p) {
            $p->stock_status = $p->stock_actuel <= $p->seuil_min ? 'critique' 
                : ($p->stock_actuel <= $p->seuil_securite ? 'alerte' : 'ok');
            return $p;
        });

        return response()->json($produits);
    }

    public function movements(Request $request, int $produitId): JsonResponse
    {
        $produit = Produit::findOrFail($produitId);

        $movements = MouvementStock::where('produit_id', $produitId)
            ->orderBy('created_at', 'desc')
            ->paginate($request->query('per_page', 30));

        return response()->json([
            'produit' => $produit,
            'movements' => $movements,
        ]);
    }

    public function adjust(Request $request, int $id): JsonResponse
    {
        $produit = Produit::findOrFail($id);

        $data = $request->validate([
            'stock_actuel' => 'required|integer|min:0',
            'motif' => 'nullable|string',
        ]);

        $oldStock = $produit->stock_actuel;
        $newStock = $data['stock_actuel'];
        $diff = $newStock - $oldStock;

        if ($diff !== 0) {
            MouvementStock::create([
                'produit_id' => $produit->id,
                'type' => 'ajustement',
                'quantite' => abs($diff),
                'stock_avant' => $oldStock,
                'stock_apres' => $newStock,
                'motif' => $data['motif'] ?? 'Ajustement manuel',
                'user_id' => Auth::id(),
            ]);

            $produit->update(['stock_actuel' => $newStock]);
        }

        return response()->json($produit->fresh(['dci', 'fournisseur']));
    }

    public function updateThresholds(Request $request, int $id): JsonResponse
    {
        $produit = Produit::findOrFail($id);

        $data = $request->validate([
            'seuil_min' => 'required|integer|min:0',
            'seuil_securite' => 'required|integer|min:0|gte:seuil_min',
        ]);

        $produit->update($data);

        return response()->json($produit->fresh(['dci', 'fournisseur']));
    }
}
