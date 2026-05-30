<?php

namespace App\Modules\ChefService\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ChefService\Traits\ServiceScopeTrait;
use App\Modules\ClinicalCore\Models\Service;
use App\Modules\ChefService\Models\Box;
use App\Modules\ClinicalCore\Models\WaitingList;
use App\Modules\ClinicalCore\Models\Consultation;
use App\Modules\Auth\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    use ServiceScopeTrait;

    public function __invoke(Request $request): JsonResponse
    {
        $serviceId = $this->chefServiceId();
        $service = Service::find($serviceId);

        abort_unless($service, 404, 'Service introuvable.');

        // Get doctor IDs in this service for consultation count
        $doctorIds = User::whereHas('services', fn($q) =>
            $q->where('services.id', $serviceId)
        )->whereHas('roles', fn($q) =>
            $q->where('role', 'Doctor')
        )->pluck('id');

        return response()->json([
            'service_name' => $service->name,
            'box_count' => Box::where('service_id', $serviceId)->count(),
            'doctor_count' => $doctorIds->count(),
            'today_patient_count' => WaitingList::where('service_id', $serviceId)
                ->whereDate('added_at', today())->count(),
            'active_consultation_count' => Consultation::whereIn('user_id', $doctorIds)
                ->where('status', 'in_progress')->count(),
        ]);
    }
}
