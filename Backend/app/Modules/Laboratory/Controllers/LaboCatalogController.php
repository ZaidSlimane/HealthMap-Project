<?php

namespace App\Modules\Laboratory\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LaboCatalogController extends Controller
{
    /**
     * List laboratory catalog (panels, analyses, sub-analyses).
     *
     * TODO: Implement once catalog tables (labo_billon, labo_analyse, labo_s_analyse) are fully integrated.
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json([]);
    }
}
