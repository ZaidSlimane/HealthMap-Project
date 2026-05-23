<?php

namespace App\Modules\Laboratory\Controllers;

use App\Events\ResultReady;
use App\Http\Controllers\Controller;
use App\Modules\Laboratory\Requests\StoreLaboResultRequest;
use App\Modules\Laboratory\Services\LaboResultService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LaboResultController extends Controller
{
    public function __construct(
        private readonly LaboResultService $laboResultService
    ) {}

    /**
     * Enter results for a laboratory request.
     */
    public function store(StoreLaboResultRequest $request, int $demandeId): JsonResponse
    {
        $demande = $this->laboResultService->enterResults(
            $demandeId,
            $request->validated()['results']
        );

        broadcast(new ResultReady('laboratory', $demandeId))->toOthers();

        return response()->json($demande, 201);
    }

    /**
     * Get the laboratory worklist (pending/in_progress requests).
     */
    public function worklist(Request $request): JsonResponse
    {
        $filters = $request->only([
            'date', 'date_from', 'date_to', 'urgency', 'search', 'per_page',
        ]);

        $worklist = $this->laboResultService->getWorklist($filters);

        return response()->json($worklist);
    }
}
