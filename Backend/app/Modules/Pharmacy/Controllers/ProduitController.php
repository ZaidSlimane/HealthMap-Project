<?php

namespace App\Modules\Pharmacy\Controllers;

use App\Modules\Pharmacy\Models\Produit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProduitController
{
    public function index(Request $request): JsonResponse
    {
        $query = Produit::with('dci', 'fournisseur');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code_nomenclature', 'like', "%{$search}%")
                  ->orWhere('nom_commercial', 'like', "%{$search}%")
                  ->orWhereHas('dci', fn($dq) => $dq->where('denomination', 'like', "%{$search}%"));
            });
        }

        if ($request->query('alerts')) {
            $query->whereColumn('stock_actuel', '<=', 'seuil_securite');
        }

        $produits = $query->orderBy('nom_commercial')->paginate($request->query('per_page', 20));

        return response()->json($produits);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code_nomenclature' => 'required|string|max:30|unique:produits,code_nomenclature',
            'nom_commercial' => 'required|string',
            'dci_id' => 'nullable|exists:dci,id',
            'fournisseur_id' => 'nullable|exists:fournisseurs,id',
            'forme' => 'nullable|string',
            'dosage' => 'nullable|string',
            'unite' => 'nullable|string',
            'stock_actuel' => 'integer|min:0',
            'seuil_min' => 'integer|min:0',
            'seuil_securite' => 'integer|min:0',
            'prix_unitaire' => 'nullable|numeric',
            'is_psychotrope' => 'boolean',
            'is_stupefiant' => 'boolean',
        ]);

        $produit = Produit::create($data);
        return response()->json($produit->load('dci', 'fournisseur'), 201);
    }

    public function show(int $id): JsonResponse
    {
        $produit = Produit::with('dci', 'fournisseur', 'mouvements')->findOrFail($id);
        return response()->json($produit);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $produit = Produit::findOrFail($id);

        $data = $request->validate([
            'code_nomenclature' => "sometimes|string|max:30|unique:produits,code_nomenclature,{$id}",
            'nom_commercial' => 'sometimes|string',
            'dci_id' => 'nullable|exists:dci,id',
            'fournisseur_id' => 'nullable|exists:fournisseurs,id',
            'forme' => 'nullable|string',
            'dosage' => 'nullable|string',
            'unite' => 'nullable|string',
            'stock_actuel' => 'sometimes|integer|min:0',
            'seuil_min' => 'sometimes|integer|min:0',
            'seuil_securite' => 'sometimes|integer|min:0',
            'prix_unitaire' => 'nullable|numeric',
            'is_psychotrope' => 'boolean',
            'is_stupefiant' => 'boolean',
        ]);

        $produit->update($data);
        return response()->json($produit->fresh(['dci', 'fournisseur']));
    }

    public function destroy(int $id): JsonResponse
    {
        $produit = Produit::findOrFail($id);
        $produit->delete();
        return response()->json(null, 204);
    }
}
