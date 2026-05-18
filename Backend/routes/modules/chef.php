<?php

use Illuminate\Support\Facades\Route;
use App\Modules\ChefService\Controllers\DashboardController;
use App\Modules\ChefService\Controllers\BoxController;
use App\Modules\ChefService\Controllers\AssignmentController;
use App\Modules\ChefService\Controllers\DoctorController;

Route::middleware(['auth', 'role:ChefService'])->prefix('chef')->group(function () {
    Route::get('dashboard', DashboardController::class);
    Route::apiResource('boxes', BoxController::class);
    Route::post('boxes/{box}/assignments', [AssignmentController::class, 'store']);
    Route::delete('assignments/{assignment}', [AssignmentController::class, 'destroy']);
    Route::get('doctors', [DoctorController::class, 'index']);
});
