<?php

namespace App\Modules\Auth\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Modules\ClinicalCore\Models\Poste;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Tab 2 — Grades. Plain CRUD over the `postes` lookup table.
 */
class PostesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 50);
        return response()->json(
            Poste::orderBy('label')->paginate($perPage)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'label' => ['required', 'string', 'max:135', Rule::unique('postes', 'label')],
            'label_ar' => 'nullable|string|max:135',
        ]);
        return response()->json(Poste::create($data), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $poste = Poste::findOrFail($id);
        $data = $request->validate([
            'label' => ['required', 'string', 'max:135', Rule::unique('postes', 'label')->ignore($id)],
            'label_ar' => 'nullable|string|max:135',
        ]);
        $poste->fill($data)->save();
        return response()->json($poste);
    }

    public function destroy(int $id): JsonResponse
    {
        $poste = Poste::findOrFail($id);
        // FK on users.poste_id is `nullOnDelete`, so users keep working.
        $poste->delete();
        return response()->json(null, 204);
    }
}
