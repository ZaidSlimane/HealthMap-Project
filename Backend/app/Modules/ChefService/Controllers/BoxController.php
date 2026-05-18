<?php

namespace App\Modules\ChefService\Controllers;

use App\Modules\ClinicalCore\Controllers\BaseResourceController;
use App\Modules\ChefService\Traits\ServiceScopeTrait;
use App\Modules\ChefService\Models\Box;
use App\Modules\ChefService\Requests\StoreBoxRequest;
use App\Modules\ChefService\Requests\UpdateBoxRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BoxController extends BaseResourceController
{
    use ServiceScopeTrait;

    protected string $modelClass = Box::class;
    protected ?string $storeRequest = StoreBoxRequest::class;
    protected ?string $updateRequest = UpdateBoxRequest::class;
    protected array $with = ['assignedDoctor.user'];

    public function index(Request $request): JsonResponse
    {
        $serviceId = $this->chefServiceId();
        $boxes = Box::where('service_id', $serviceId)
            ->with('assignedDoctor.user')
            ->paginate($request->query('per_page', 25));

        // Transform assigned_doctor to a flat { id, name } for the frontend
        $boxes->getCollection()->transform(function ($box) {
            $assignment = $box->assignedDoctor;
            $box->assigned_doctor = $assignment && $assignment->user
                ? ['id' => $assignment->user->id, 'name' => $assignment->user->name . ' ' . $assignment->user->first_name]
                : null;
            unset($box->assignedDoctor);
            return $box;
        });

        return response()->json($boxes);
    }

    public function store(Request $request): JsonResponse
    {
        $data = app(StoreBoxRequest::class)->validated();
        $data['service_id'] = $this->chefServiceId();
        $data['establishment_id'] = auth()->user()->establishment_id;
        $box = Box::create($data);

        return response()->json($box, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $box = Box::findOrFail($id);
        $this->authorizeServiceAccess($box->service_id);
        $data = app(UpdateBoxRequest::class)->validated();
        $box->fill($data)->save();

        return response()->json($box);
    }

    public function destroy(int $id): JsonResponse
    {
        $box = Box::findOrFail($id);
        $this->authorizeServiceAccess($box->service_id);

        if ($box->activeAssignments()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer : la box a des affectations actives.',
            ], 422);
        }

        $box->delete();

        return response()->json(null, 204);
    }
}
