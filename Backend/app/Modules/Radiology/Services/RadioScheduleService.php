<?php

namespace App\Modules\Radiology\Services;

use App\Modules\Radiology\Models\RadioDemande;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Symfony\Component\HttpKernel\Exception\HttpException;

class RadioScheduleService
{
    /**
     * Schedule a pending RadioDemande at the given date-time.
     *
     * Validates that the demande is in "pending" status and that no time slot
     * conflict exists (another appointment within a 30-minute window).
     *
     * @param int $demandeId
     * @param string $scheduledAt ISO 8601 datetime string
     * @return RadioDemande
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     * @throws HttpException 409 if status is not pending or time slot conflicts
     */
    public function schedule(int $demandeId, string $scheduledAt): RadioDemande
    {
        $demande = RadioDemande::findOrFail($demandeId);

        if ($demande->status !== 'pending') {
            throw new HttpException(409, 'Seules les demandes en attente peuvent être programmées');
        }

        $scheduledTime = Carbon::parse($scheduledAt);

        // Check for time slot conflicts within a 30-minute window
        $conflictingDemande = RadioDemande::where('status', 'scheduled')
            ->where('id', '!=', $demande->id)
            ->where('scheduled_at', '>=', $scheduledTime->copy()->subMinutes(30))
            ->where('scheduled_at', '<', $scheduledTime->copy()->addMinutes(30))
            ->first();

        if ($conflictingDemande) {
            throw new HttpException(409, 'Ce créneau est déjà occupé');
        }

        $demande->update([
            'status' => 'scheduled',
            'scheduled_at' => $scheduledTime,
        ]);

        return $demande->fresh();
    }

    /**
     * Unschedule a scheduled RadioDemande, resetting it to pending.
     *
     * @param int $demandeId
     * @return RadioDemande
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     * @throws HttpException 409 if status is not scheduled
     */
    public function unschedule(int $demandeId): RadioDemande
    {
        $demande = RadioDemande::findOrFail($demandeId);

        if ($demande->status !== 'scheduled') {
            throw new HttpException(409, 'Seules les demandes programmées peuvent être déprogrammées');
        }

        $demande->update([
            'status' => 'pending',
            'scheduled_at' => null,
        ]);

        return $demande->fresh();
    }

    /**
     * Get scheduled appointments within a date range, optionally filtered by establishment.
     *
     * @param string $from ISO 8601 date/datetime string (inclusive)
     * @param string $to ISO 8601 date/datetime string (inclusive)
     * @param int|null $establishmentId Optional establishment filter
     * @return Collection
     */
    public function getAppointments(string $from, string $to, ?int $establishmentId = null): Collection
    {
        $query = RadioDemande::where('status', 'scheduled')
            ->whereBetween('scheduled_at', [
                Carbon::parse($from)->startOfDay(),
                Carbon::parse($to)->endOfDay(),
            ])
            ->with(['examType', 'consultation']);

        if ($establishmentId) {
            $query->whereHas('consultation', function ($q) use ($establishmentId) {
                $q->where('establishment_id', $establishmentId);
            });
        }

        return $query->orderBy('scheduled_at', 'asc')->get();
    }

    /**
     * Bypass scheduling for a pending RadioDemande, moving it directly to in_progress.
     *
     * @param int $demandeId
     * @return RadioDemande
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     * @throws HttpException 409 if status is not pending
     */
    public function bypass(int $demandeId): RadioDemande
    {
        $demande = RadioDemande::findOrFail($demandeId);

        if ($demande->status !== 'pending') {
            throw new HttpException(409, 'Seules les demandes en attente peuvent être passées sans RDV');
        }

        $demande->update([
            'status' => 'in_progress',
        ]);

        return $demande->fresh();
    }
}
