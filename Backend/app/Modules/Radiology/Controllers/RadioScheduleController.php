<?php

namespace App\Modules\Radiology\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Radiology\Requests\ScheduleRequest;
use App\Modules\Radiology\Services\RadioScheduleService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class RadioScheduleController extends Controller
{
    public function __construct(
        private readonly RadioScheduleService $radioScheduleService
    ) {}

    /**
     * Schedule a pending RadioDemande at the given date-time.
     *
     * POST /radiology/schedule
     */
    public function schedule(ScheduleRequest $request): JsonResponse
    {
        try {
            $demande = $this->radioScheduleService->schedule(
                $request->validated()['radio_demande_id'],
                $request->validated()['scheduled_at']
            );

            return response()->json($demande->load(['examType', 'consultation']));
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Demande introuvable'], 404);
        } catch (HttpException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }
    }

    /**
     * Unschedule a scheduled RadioDemande, resetting it to pending.
     *
     * DELETE /radiology/schedule/{id}
     */
    public function unschedule(int $id): JsonResponse
    {
        try {
            $demande = $this->radioScheduleService->unschedule($id);

            return response()->json(['message' => 'Rendez-vous déprogrammé avec succès']);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Demande introuvable'], 404);
        } catch (HttpException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }
    }

    /**
     * Get scheduled appointments within a date range.
     *
     * GET /radiology/schedule/appointments
     */
    public function appointments(Request $request): JsonResponse
    {
        $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date'],
            'establishment_id' => ['nullable', 'integer', 'exists:establishments,id'],
        ]);

        $appointments = $this->radioScheduleService->getAppointments(
            $request->input('from'),
            $request->input('to'),
            $request->input('establishment_id')
        );

        return response()->json($appointments);
    }

    /**
     * Bypass scheduling for a pending RadioDemande, moving it directly to in_progress.
     *
     * PATCH /radiology/schedule/{id}/bypass
     */
    public function bypass(int $id): JsonResponse
    {
        try {
            $demande = $this->radioScheduleService->bypass($id);

            return response()->json($demande->load(['examType', 'consultation']));
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Demande introuvable'], 404);
        } catch (HttpException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }
    }
}
