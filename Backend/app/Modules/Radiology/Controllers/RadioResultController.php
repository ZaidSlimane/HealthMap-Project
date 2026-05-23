<?php

namespace App\Modules\Radiology\Controllers;

use App\Events\ResultReady;
use App\Http\Controllers\Controller;
use App\Modules\Radiology\Models\RadioResultat;
use App\Modules\Radiology\Requests\StoreRadioResultRequest;
use App\Modules\Radiology\Services\RadioResultService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class RadioResultController extends Controller
{
    public function __construct(
        private readonly RadioResultService $radioResultService
    ) {}

    /**
     * Upload a result for a radiology request.
     */
    public function store(StoreRadioResultRequest $request, int $demandeId): JsonResponse
    {
        $resultat = $this->radioResultService->uploadResult(
            $demandeId,
            $request->file('file'),
            $request->input('compte_rendu')
        );

        broadcast(new ResultReady('radiology', $demandeId))->toOthers();

        return response()->json($resultat, 201);
    }

    /**
     * Download a radiology result file.
     */
    public function download(int $id): Response
    {
        $resultat = RadioResultat::findOrFail($id);

        if (!$resultat->file_path || !Storage::disk('private')->exists($resultat->file_path)) {
            abort(404, 'File not found.');
        }

        return Storage::disk('private')->download($resultat->file_path);
    }

    /**
     * Get the radiology worklist (pending/in_progress requests).
     */
    public function worklist(Request $request): JsonResponse
    {
        $filters = $request->only([
            'date', 'date_from', 'date_to', 'urgency', 'search', 'per_page',
        ]);

        $worklist = $this->radioResultService->getWorklist($filters);

        return response()->json($worklist);
    }
}
