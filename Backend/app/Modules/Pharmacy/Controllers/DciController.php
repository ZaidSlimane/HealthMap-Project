<?php

namespace App\Modules\Pharmacy\Controllers;

use App\Modules\Pharmacy\Models\Dci;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DciController
{
    public function index(Request $request): JsonResponse
    {
        $query = Dci::query();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('denomination', 'like', "%{$search}%")
                  ->orWhere('classe_therapeutique', 'like', "%{$search}%");
            });
        }

        $dci = $query->orderBy('denomination')->paginate($request->query('per_page', 20));

        return response()->json($dci);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => 'required|string|max:20|unique:dci,code',
            'denomination' => 'required|string',
            'classification' => 'in:nationale,orse,strategique',
            'classe_therapeutique' => 'nullable|string',
        ]);

        $dci = Dci::create($data);
        return response()->json($dci, 201);
    }

    public function show(int $id): JsonResponse
    {
        $dci = Dci::with('produits')->findOrFail($id);
        return response()->json($dci);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $dci = Dci::findOrFail($id);

        $data = $request->validate([
            'code' => "sometimes|string|max:20|unique:dci,code,{$id}",
            'denomination' => 'sometimes|string',
            'classification' => 'sometimes|in:nationale,orse,strategique',
            'classe_therapeutique' => 'nullable|string',
        ]);

        $dci->update($data);
        return response()->json($dci);
    }

    public function destroy(int $id): JsonResponse
    {
        $dci = Dci::findOrFail($id);
        $dci->delete();
        return response()->json(null, 204);
    }
}
