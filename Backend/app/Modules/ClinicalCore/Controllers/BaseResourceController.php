<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Generic JSON CRUD controller for ClinicalCore resources.
 *
 * Subclasses set $modelClass and (optionally) $storeRequest / $updateRequest.
 * When a FormRequest class is configured the controller resolves it from the
 * container so its rules + authorization run before we hit the model.
 *
 * If no FormRequest is configured we fall back to "accept whatever is in
 * $fillable" — handy for read-only-ish reference resources but unsafe for
 * anything that crosses tenant boundaries; configure validation there.
 */
abstract class BaseResourceController extends Controller
{
    /** @var class-string<Model> */
    protected string $modelClass;

    /** @var array<int, string> Eager-loaded relations applied to index/show. */
    protected array $with = [];

    /** @var class-string<FormRequest>|null */
    protected ?string $storeRequest = null;

    /** @var class-string<FormRequest>|null */
    protected ?string $updateRequest = null;

    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 25);
        $query = $this->modelClass::query()->with($this->with);

        return response()->json($query->paginate($perPage));
    }

    public function show(int $id): JsonResponse
    {
        $model = $this->modelClass::with($this->with)->findOrFail($id);

        return response()->json($model);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->storeRequest
            ? app($this->storeRequest)->validated()
            : $request->only($this->fillable());

        /** @var Model $model */
        $model = $this->modelClass::create($data);

        return response()->json($model->load($this->with), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        /** @var Model $model */
        $model = $this->modelClass::findOrFail($id);

        $data = $this->updateRequest
            ? app($this->updateRequest)->validated()
            : $request->only($this->fillable());

        $model->fill($data)->save();

        return response()->json($model->load($this->with));
    }

    public function destroy(int $id): JsonResponse
    {
        $this->modelClass::findOrFail($id)->delete();

        return response()->json(null, 204);
    }

    /**
     * @return array<int, string>
     */
    protected function fillable(): array
    {
        return (new $this->modelClass)->getFillable();
    }
}
