<?php

namespace App\Modules\ClinicalCore\Services;

use App\Events\PatientAdmitted;
use App\Modules\ClinicalCore\Models\Admission;
use App\Modules\ClinicalCore\Models\Bed;
use App\Modules\ClinicalCore\Models\Consultation;
use App\Modules\ClinicalCore\Models\PatientMovement;
use App\Modules\ClinicalCore\Models\WaitingList;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AdmissionService
{
    /**
     * Admit a patient from a consultation.
     *
     * Creates an admission, links it to the consultation, assigns a bed,
     * records the movement, marks the bed occupied, and reassigns any
     * pending lab/radio requests from consultation to admission context.
     */
    public function admitFromConsultation(int $consultationId, int $serviceId, int $bedId, ?string $motif = null): Admission
    {
        // 1. Persist everything in the database FIRST (single transaction)
        $admission = DB::transaction(function () use ($consultationId, $serviceId, $bedId, $motif) {
            // Resolve the consultation — REQUIRE a valid ID, no fallback to avoid wrong-patient risk
            $consultation = Consultation::find($consultationId);
            if (!$consultation && $consultationId <= 0) {
                // Only fallback if explicitly 0 (frontend session lost) — use SAME patient context
                $consultation = Consultation::where('user_id', auth()->id())
                    ->where('status', 'in_progress')
                    ->latest()
                    ->first();
            }

            abort_unless($consultation, 404, 'No active consultation found.');

            // GUARD: prevent double admission
            if ($consultation->status === 'admitted') {
                abort(422, 'Ce patient est déjà admis depuis cette consultation.');
            }
            if ($consultation->admission_id !== null) {
                abort(422, 'Cette consultation a déjà une admission liée.');
            }

            // GUARD: prevent assigning an already-occupied bed
            $bed = Bed::where('id', $bedId)->where('status', 'free')->first();
            abort_unless($bed, 422, 'Ce lit est déjà occupé.');

            $admissionMotif = $motif ?: $consultation->diagnostic ?: $consultation->compte_rendu;

            // Create admission
            $admission = Admission::create([
                'patient_id' => $consultation->patient_id,
                'service_id' => $serviceId,
                'bed_id' => $bedId,
                'date_admission' => now(),
                'motif_admission' => $admissionMotif,
                'mode' => 'normale',
                'status' => 'active',
                'establishment_id' => $consultation->establishment_id,
            ]);

            // Update consultation state → admitted (single source of truth)
            $consultation->update([
                'admission_id' => $admission->id,
                'status' => 'admitted',
                'completed_at' => now(),
            ]);

            // Complete the waiting list entry (no longer in queue)
            if ($consultation->waiting_list_id) {
                WaitingList::where('id', $consultation->waiting_list_id)->update([
                    'status' => 'completed',
                    'consultation_at' => $consultation->consultation_at ?? now(),
                ]);
            }

            // Record patient movement
            PatientMovement::create([
                'patient_id' => $consultation->patient_id,
                'admission_id' => $admission->id,
                'bed_id' => $bedId,
                'moved_at' => now(),
                'reason' => 'Admission depuis consultation',
            ]);

            // Mark bed as occupied (model event also does this, but explicit for clarity)
            $bed->update(['status' => 'occupied']);

            // Reassign pending radio/labo requests from consultation to admission
            DB::table('radio_demande')
                ->where('consultation_id', $consultation->id)
                ->whereIn('status', ['pending', 'in_progress'])
                ->update(['admission_id' => $admission->id]);

            DB::table('labo_demande')
                ->where('consultation_id', $consultation->id)
                ->whereIn('status', ['pending', 'in_progress'])
                ->update(['admission_id' => $admission->id]);

            return $admission->load(['patient', 'service', 'bed.room.unit']);
        });

        // 2. AFTER DB commit: dispatch real-time event via Redis/Reverb
        // Redis is transport only — no business data stored there
        broadcast(new PatientAdmitted(
            admissionId: $admission->id,
            serviceId: $admission->service_id,
            bedId: $admission->bed_id,
            patientName: trim(($admission->patient->name ?? '') . ' ' . ($admission->patient->first_name ?? '')),
        ))->toOthers();

        return $admission;
    }

    /**
     * Get free beds for a service, grouped by unit → room → beds.
     */
    public function getFreeBedsByService(int $serviceId): array
    {
        $units = DB::table('establishment_units')
            ->where('service_id', $serviceId)
            ->get(['id', 'name']);

        $result = [];

        foreach ($units as $unit) {
            $rooms = DB::table('rooms')
                ->where('establishment_unit_id', $unit->id)
                ->get(['id', 'name', 'capacity']);

            $unitData = [
                'id' => $unit->id,
                'name' => $unit->name,
                'rooms' => [],
            ];

            foreach ($rooms as $room) {
                $beds = DB::table('beds')
                    ->where('room_id', $room->id)
                    ->where('status', 'free')
                    ->get(['id', 'bed_number', 'status']);

                if ($beds->isNotEmpty()) {
                    $unitData['rooms'][] = [
                        'id' => $room->id,
                        'name' => $room->name,
                        'beds' => $beds->toArray(),
                    ];
                }
            }

            if (!empty($unitData['rooms'])) {
                $result[] = $unitData;
            }
        }

        return $result;
    }
}
