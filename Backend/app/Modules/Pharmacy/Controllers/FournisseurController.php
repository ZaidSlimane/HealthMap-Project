<?php

namespace App\Modules\Pharmacy\Controllers;

use App\Modules\Pharmacy\Models\Fournisseur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FournisseurController
{
    public function index(Request $request): JsonResponse
    {
        $query = Fournisseur::query();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('contact', 'like', "%{$search}%");
            });
        }

        $fournisseurs = $query->orderBy('nom')->paginate($request->query('per_page', 20));

        return response()->json($fournisseurs);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom' => 'required|string',
            'type' => 'in:fournisseur,laboratoire',
            'contact' => 'nullable|string',
            'email' => 'nullable|email',
            'telephone' => 'nullable|string',
            'adresse' => 'nullable|string',
        ]);

        $fournisseur = Fournisseur::create($data);
        return response()->json($fournisseur, 201);
    }

    public function show(int $id): JsonResponse
    {
        $fournisseur = Fournisseur::with('produits', 'commandes')->findOrFail($id);
        return response()->json($fournisseur);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $fournisseur = Fournisseur::findOrFail($id);

        $data = $request->validate([
            'nom' => 'sometimes|string',
            'type' => 'sometimes|in:fournisseur,laboratoire',
            'contact' => 'nullable|string',
            'email' => 'nullable|email',
            'telephone' => 'nullable|string',
            'adresse' => 'nullable|string',
        ]);

        $fournisseur->update($data);
        return response()->json($fournisseur);
    }

    public function destroy(int $id): JsonResponse
    {
        $fournisseur = Fournisseur::findOrFail($id);
        $fournisseur->delete();
        return response()->json(null, 204);
    }
}
