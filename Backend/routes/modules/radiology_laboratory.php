<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Radiology\Controllers\RadioCatalogController;
use App\Modules\Radiology\Controllers\RadioRequestController;
use App\Modules\Radiology\Controllers\RadioResultController;
use App\Modules\Radiology\Controllers\RadioScheduleController;
use App\Modules\Laboratory\Controllers\LaboCatalogController;
use App\Modules\Laboratory\Controllers\LaboDashboardController;
use App\Modules\Laboratory\Controllers\LaboRequestController;
use App\Modules\Laboratory\Controllers\LaboResultController;

/*
|--------------------------------------------------------------------------
| Radiology & Laboratory API
|--------------------------------------------------------------------------
| Routes for the radiology and laboratory modules. Grouped by role
| requirements: Doctors create/cancel requests, Technicians process
| worklists and submit results.
*/

Route::middleware(['auth'])->group(function () {
    // Radiology catalog (any authenticated user)
    Route::get('radiology/exam-types', [RadioCatalogController::class, 'index']);

    // Laboratory catalog
    Route::get('laboratory/catalog', [LaboCatalogController::class, 'index']);

    // Radiology requests (Doctor + Admin)
    Route::middleware('role:Admin,Doctor')->group(function () {
        Route::post('radiology/requests', [RadioRequestController::class, 'store']);
        Route::get('radiology/requests', [RadioRequestController::class, 'index']);
        Route::get('radiology/requests/{id}', [RadioRequestController::class, 'show']);
        Route::patch('radiology/requests/{id}/cancel', [RadioRequestController::class, 'cancel']);
    });

    // Radiology worklist + results (RadioTech + Admin)
    Route::middleware('role:Admin,RadioTech')->group(function () {
        Route::get('radiology/worklist', [RadioResultController::class, 'worklist']);
        Route::post('radiology/requests/{id}/result', [RadioResultController::class, 'store']);
    });

    // Radiology scheduling (RadioTech + Admin)
    Route::middleware('role:Admin,RadioTech')->group(function () {
        Route::post('radiology/schedule', [RadioScheduleController::class, 'schedule']);
        Route::delete('radiology/schedule/{id}', [RadioScheduleController::class, 'unschedule']);
        Route::get('radiology/schedule/appointments', [RadioScheduleController::class, 'appointments']);
        Route::patch('radiology/schedule/{id}/bypass', [RadioScheduleController::class, 'bypass']);
    });

    // Result download (Doctor + RadioTech + Admin)
    Route::middleware('role:Admin,Doctor,RadioTech')->group(function () {
        Route::get('radiology/results/{id}/download', [RadioResultController::class, 'download']);
    });

    // Laboratory requests (Doctor + Admin)
    Route::middleware('role:Admin,Doctor')->group(function () {
        Route::post('laboratory/requests', [LaboRequestController::class, 'store']);
        Route::get('laboratory/requests', [LaboRequestController::class, 'index']);
        Route::get('laboratory/requests/{id}', [LaboRequestController::class, 'show']);
        Route::patch('laboratory/requests/{id}/cancel', [LaboRequestController::class, 'cancel']);
    });

    // Laboratory dashboard (LabTech + Admin)
    Route::middleware('role:Admin,LabTech')->group(function () {
        Route::get('laboratory/dashboard', [LaboDashboardController::class, 'index']);
    });

    // Laboratory worklist + results (LabTech + Admin)
    Route::middleware('role:Admin,LabTech')->group(function () {
        Route::get('laboratory/worklist', [LaboResultController::class, 'worklist']);
        Route::post('laboratory/requests/{id}/results', [LaboResultController::class, 'store']);
    });
});
