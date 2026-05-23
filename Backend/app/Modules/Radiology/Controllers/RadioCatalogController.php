<?php

namespace App\Modules\Radiology\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ClinicalCore\Models\RadiologyExamType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RadioCatalogController extends Controller
{
    /**
     * List active radiology exam types with optional search filter.
     */
    public function index(Request $request): JsonResponse
    {
        $query = RadiologyExamType::where('is_active', true);

        if ($request->has('search')) {
            $query->where('label', 'like', '%' . $request->input('search') . '%');
        }

        return response()->json($query->get());
    }
}
