<?php

namespace App\Modules\ChefService\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ChefService\Traits\ServiceScopeTrait;
use App\Modules\ChefService\Models\DoctorShiftAssignment;
use App\Modules\ChefService\Requests\StoreAssignmentRequest;
use App\Modules\ChefService\Models\Box;
use App\Modules\Auth\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AssignmentController extends Controller
{
    use ServiceScopeTrait;

    public function store(Request $request, int $boxId): JsonResponse
    {
        $data = app(StoreAssignmentRequest::class)->validated();
        $box = Box::findOrFail($boxId);
        $this->authorizeServiceAccess($box->service_id);

        $serviceId = $this->chefServiceId();
        // Verify doctor belongs to this service
        $doctorInService = User::whereHas('services', fn($q) =>
            $q->where('services.id', $serviceId)
        )->where('id', $data['user_id'])->exists();

        abort_unless($doctorInService, 403, 'Doctor does not belong to this service.');

        $assignment = DoctorShiftAssignment::create([
            ...$data,
            'service_id' => $serviceId,
            'box_id' => $boxId,
            'assigned_by' => auth()->id(),
        ]);

        return response()->json($assignment, 201);
    }

    public function destroy(int $id): JsonResponse
    {
        $assignment = DoctorShiftAssignment::findOrFail($id);
        $this->authorizeServiceAccess($assignment->service_id);
        $assignment->delete();

        return response()->json(null, 204);
    }
}
