<?php

namespace App\Modules\Radiology\Controllers;

use App\Events\ExamRequested;
use App\Events\RequestCancelled;
use App\Http\Controllers\Controller;
use App\Modules\Radiology\Models\RadioDemande;
use App\Modules\Radiology\Requests\StoreRadioRequestRequest;
use App\Modules\Radiology\Services\RadioRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RadioRequestController extends Controller
{
    public function __construct(
        private readonly RadioRequestService $radioRequestService
    ) {}

    /**
     * Create a new radiology request.
     */
    public function store(StoreRadioRequestRequest $request): JsonResponse
    {
        $demandes = $this->radioRequestService->createRequest($request->validated());

        broadcast(new ExamRequested('radiology', $demandes))->toOthers();

        return response()->json($demandes, 201);
    }

    /**
     * List radiology requests. Filterable by consultation_id or paginated.
     */
    public function index(Request $request): JsonResponse
    {
        if ($request->has('consultation_id')) {
            $results = $this->radioRequestService->getForConsultation(
                (int) $request->input('consultation_id')
            );

            return response()->json($results);
        }

        $demandes = RadioDemande::with(['examType', 'resultat', 'requestedBy'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json($demandes);
    }

    /**
     * Show a single radiology request with relationships.
     */
    public function show(int $id): JsonResponse
    {
        $demande = RadioDemande::with(['examType', 'resultat', 'requestedBy'])
            ->findOrFail($id);

        return response()->json($demande);
    }

    /**
     * Cancel a pending radiology request.
     */
    public function cancel(int $id): JsonResponse
    {
        $demande = $this->radioRequestService->cancel($id);

        broadcast(new RequestCancelled('radiology', $demande->id))->toOthers();

        return response()->json($demande);
    }
}
