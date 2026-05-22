<?php

namespace App\Modules\Laboratory\Controllers;

use App\Events\ExamRequested;
use App\Events\RequestCancelled;
use App\Http\Controllers\Controller;
use App\Modules\Laboratory\Models\LaboDemande;
use App\Modules\Laboratory\Requests\StoreLaboRequestRequest;
use App\Modules\Laboratory\Services\LaboRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LaboRequestController extends Controller
{
    public function __construct(
        private readonly LaboRequestService $laboRequestService
    ) {}

    /**
     * Create a new laboratory request.
     */
    public function store(StoreLaboRequestRequest $request): JsonResponse
    {
        $demande = $this->laboRequestService->createRequest($request->validated());

        broadcast(new ExamRequested('laboratory', $demande))->toOthers();

        return response()->json($demande, 201);
    }

    /**
     * List laboratory requests. Filterable by consultation_id or paginated.
     */
    public function index(Request $request): JsonResponse
    {
        if ($request->has('consultation_id')) {
            $results = $this->laboRequestService->getForConsultation(
                (int) $request->input('consultation_id')
            );

            return response()->json($results);
        }

        $demandes = LaboDemande::with(['items', 'results', 'requestedBy'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json($demandes);
    }

    /**
     * Show a single laboratory request with relationships.
     */
    public function show(int $id): JsonResponse
    {
        $demande = LaboDemande::with(['items', 'results'])
            ->findOrFail($id);

        return response()->json($demande);
    }

    /**
     * Cancel a pending laboratory request.
     */
    public function cancel(int $id): JsonResponse
    {
        $demande = $this->laboRequestService->cancel($id);

        broadcast(new RequestCancelled('laboratory', $demande->id))->toOthers();

        return response()->json($demande);
    }
}
