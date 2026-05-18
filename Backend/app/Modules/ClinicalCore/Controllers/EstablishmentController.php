<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ClinicalCore\Models\Establishment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EstablishmentController extends Controller
{
    public function show(int $id): JsonResponse
    {
        $est = Establishment::with(['type', 'province'])->findOrFail($id);
        return response()->json($est);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $est = Establishment::findOrFail($id);

        $data = $request->only([
            'name', 'name_ar', 'address', 'phone', 'email', 'fax', 'directeur',
        ]);

        $est->fill($data)->save();

        return response()->json($est->load(['type', 'province']));
    }
}
