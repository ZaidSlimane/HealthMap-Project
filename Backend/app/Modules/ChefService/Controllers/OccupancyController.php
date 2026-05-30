<?php

namespace App\Modules\ChefService\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ChefService\Exceptions\MlServiceException;
use App\Modules\ChefService\Services\BedPredictionService;
use App\Modules\ChefService\Traits\ServiceScopeTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OccupancyController extends Controller
{
    use ServiceScopeTrait;

    public function __construct(
        private readonly BedPredictionService $predictionService
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $serviceId = $this->chefServiceId();

        try {
            $forecast = $this->predictionService->getServiceForecast($serviceId);

            return response()->json($forecast);
        } catch (MlServiceException $e) {
            return response()->json(['message' => 'Prediction service unavailable'], 503);
        }
    }
}
