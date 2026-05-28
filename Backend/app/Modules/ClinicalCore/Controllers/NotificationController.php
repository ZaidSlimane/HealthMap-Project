<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Laboratory\Models\LaboDemande;
use App\Modules\Radiology\Models\RadioDemande;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Provides real-time notification counts for the header bell icon.
 *
 * Roles and what they see:
 *   Doctor      → pending results ready (lab + radio) for their consultations
 *   LabTech     → pending lab exam requests waiting for processing
 *   RadioTech   → pending radiology requests waiting for processing
 *   Admin       → all pending counts across modules
 */
class NotificationController extends Controller
{
    public function counts(Request $request): JsonResponse
    {
        $user     = $request->user();
        $roles    = $user->roles->pluck('role')->map(fn($r) => strtolower($r))->toArray();
        $isAdmin  = in_array('admin', $roles);
        $isDoctor = in_array('doctor', $roles);
        $isLab    = in_array('labtech', $roles) || in_array('labheadchief', $roles);
        $isRadio  = in_array('radiotech', $roles) || in_array('radioheadchief', $roles);

        $counts = [
            'labo_pending'  => 0,
            'radio_pending' => 0,
            'results_ready' => 0,
            'total'         => 0,
        ];

        if ($isAdmin || $isLab) {
            // Lab techs see how many new lab requests are waiting
            $counts['labo_pending'] = LaboDemande::whereIn('status', ['pending', 'in_progress'])
                ->count();
        }

        if ($isAdmin || $isRadio) {
            // Radio techs see how many new radio requests are waiting
            $counts['radio_pending'] = RadioDemande::whereIn('status', ['pending', 'in_progress'])
                ->count();
        }

        if ($isAdmin || $isDoctor) {
            // Doctors see how many of their requests have completed results
            $labResultsReady = LaboDemande::where('status', 'completed')
                ->where('requested_by', $user->id)
                ->count();

            $radioResultsReady = RadioDemande::where('status', 'completed')
                ->where('requested_by', $user->id)
                ->count();

            $counts['results_ready'] = $labResultsReady + $radioResultsReady;
        }

        $counts['total'] = $counts['labo_pending']
            + $counts['radio_pending']
            + $counts['results_ready'];

        return response()->json($counts);
    }

    /**
     * Mark all pending notifications as seen for the current user.
     * Called when the user opens the notification panel.
     */
    public function markSeen(Request $request): JsonResponse
    {
        // For now returns 204 — full "seen" tracking per notification
        // can be added in a later iteration using a notifications table.
        return response()->json(null, 204);
    }
}
