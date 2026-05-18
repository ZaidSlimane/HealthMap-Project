<?php

namespace App\Modules\ChefService\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ChefService\Traits\ServiceScopeTrait;
use App\Modules\ChefService\Models\DoctorShiftAssignment;
use App\Modules\Auth\Models\User;
use Illuminate\Http\JsonResponse;

class DoctorController extends Controller
{
    use ServiceScopeTrait;

    public function index(): JsonResponse
    {
        $serviceId = $this->chefServiceId();

        $doctors = User::whereHas('services', fn($q) =>
            $q->where('services.id', $serviceId)
        )->whereHas('roles', fn($q) =>
            $q->where('role', 'Doctor')
        )->with(['services' => fn($q) => $q->where('services.id', $serviceId)])
         ->get()
         ->map(fn($doctor) => [
             'id' => $doctor->id,
             'name' => $doctor->name . ' ' . $doctor->first_name,
             'assigned_box' => DoctorShiftAssignment::where('user_id', $doctor->id)
                 ->where('service_id', $serviceId)
                 ->where('is_active', true)
                 ->with('box:id,name,label_fr')
                 ->first()?->box,
             'schedule_summary' => DoctorShiftAssignment::where('user_id', $doctor->id)
                 ->where('service_id', $serviceId)
                 ->where('is_active', true)
                 ->get(['day_of_week', 'start_time', 'end_time']),
             'is_active' => $doctor->is_active,
         ]);

        return response()->json($doctors);
    }
}
