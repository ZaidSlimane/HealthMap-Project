<?php

use App\Modules\ChefService\Controllers\OccupancyController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Predictions Module Routes
|--------------------------------------------------------------------------
|
| Routes for ML-powered prediction endpoints.
| Protected by auth + role:ChefService middleware.
|
*/

Route::middleware(['auth', 'role:ChefService'])
    ->prefix('predictions')
    ->group(function () {
        Route::get('occupancy', OccupancyController::class);
    });
