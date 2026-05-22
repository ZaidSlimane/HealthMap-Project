<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Modules\ClinicalCore\Models\WaitingList;
use App\Modules\ClinicalCore\Models\Consultation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WaitingListController extends BaseResourceController
{
    protected string $modelClass = WaitingList::class;

    protected array $with = ['patient', 'service', 'triage'];

    /**
     * Override index to order by priority (red first) then added_at (FIFO).
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 50);
        $query = WaitingList::query()->with($this->with);

        // Filter by service if provided
        if ($serviceId = $request->query('service_id')) {
            $query->where('service_id', $serviceId);
        }

        // Filter by box if provided (doctor's queue is box-scoped)
        if ($boxId = $request->query('box_id')) {
            $query->where('box_id', $boxId);
        }

        // Filter by status (default: show active entries)
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        } else {
            // By default show all non-terminal entries (including en_consultation)
            $query->whereNotIn('status', ['completed', 'absent']);
        }

        // Order: red > orange > green, then FIFO
        $query->orderByRaw("FIELD(priority, 'red', 'orange', 'green')")
              ->orderBy('added_at', 'asc');

        return response()->json($query->paginate($perPage));
    }

    // ── State Transition Endpoints ──────────────────────────────────────

    /**
     * POST /waiting-list/{id}/call → status = 'called'
     */
    public function call(int $id): JsonResponse
    {
        $entry = WaitingList::findOrFail($id);
        $this->assertTransition($entry, ['waiting', 'rappele']);

        $entry->update([
            'status' => 'called',
            'called_at' => now(),
            'called_count' => $entry->called_count + 1,
        ]);

        return response()->json($entry->load($this->with));
    }

    /**
     * POST /waiting-list/{id}/start → status = 'en_consultation'
     * Also creates a Consultation record linked to this waiting list entry.
     */
    public function start(int $id): JsonResponse
    {
        $entry = WaitingList::findOrFail($id);
        $this->assertTransition($entry, ['called']);

        $entry->update([
            'status' => 'en_consultation',
            'consultation_at' => now(),
        ]);

        // GUARD: prevent orphan consultations — check if one already exists
        $existing = Consultation::where('waiting_list_id', $entry->id)->first();
        if ($existing) {
            return response()->json([
                'waiting_list' => $entry->load($this->with),
                'consultation' => $existing->load(['patient']),
            ]);
        }

        // Create the consultation record
        $consultation = Consultation::create([
            'patient_id' => $entry->patient_id,
            'user_id' => Auth::id(),
            'box_id' => $entry->box_id,
            'waiting_list_id' => $entry->id,
            'consultation_date' => now(),
            'status' => 'in_progress',
            'started_at' => now(),
            'establishment_id' => $entry->establishment_id,
        ]);

        return response()->json([
            'waiting_list' => $entry->load($this->with),
            'consultation' => $consultation->load(['patient']),
        ]);
    }

    /**
     * POST /waiting-list/{id}/absent → status = 'absent'
     */
    public function absent(int $id): JsonResponse
    {
        $entry = WaitingList::findOrFail($id);
        $this->assertTransition($entry, ['waiting', 'called', 'rappele']);

        $entry->update(['status' => 'absent']);

        return response()->json($entry->load($this->with));
    }

    /**
     * POST /waiting-list/{id}/rappel → status = 'rappele'
     */
    public function rappel(int $id): JsonResponse
    {
        $entry = WaitingList::findOrFail($id);
        $this->assertTransition($entry, ['called', 'absent']);

        $entry->update([
            'status' => 'rappele',
            'called_count' => $entry->called_count + 1,
        ]);

        return response()->json($entry->load($this->with));
    }

    /**
     * POST /waiting-list/{id}/complete → status = 'completed'
     */
    public function complete(int $id): JsonResponse
    {
        $entry = WaitingList::findOrFail($id);
        $this->assertTransition($entry, ['en_consultation']);

        $entry->update([
            'status' => 'completed',
            'consultation_at' => $entry->consultation_at ?? now(),
        ]);

        // Mark the linked consultation as completed (fail loudly if missing)
        $consultation = $entry->consultation;
        if ($consultation) {
            $consultation->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);
        }

        return response()->json($entry->load($this->with));
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    private function assertTransition(WaitingList $entry, array $allowedFrom): void
    {
        if (!in_array($entry->status, $allowedFrom)) {
            abort(422, "Cannot transition from '{$entry->status}'. Allowed: " . implode(', ', $allowedFrom));
        }
    }
}
