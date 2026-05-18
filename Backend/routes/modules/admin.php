<?php

use App\Modules\Auth\Controllers\Admin\PersonnelController;
use App\Modules\Auth\Controllers\Admin\PostesController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'role:Admin'])->group(function () {

    // Tab 0 — Personnel
    Route::get('/personnel', [PersonnelController::class, 'indexPersonnel']);
    Route::post('/personnel', [PersonnelController::class, 'storePersonnel']);
    Route::patch('/personnel/{id}', [PersonnelController::class, 'updatePersonnel']);
    Route::delete('/personnel/{id}', [PersonnelController::class, 'destroyPersonnel']);

    // Tab 1 — Utilisateurs
    Route::get('/users', [PersonnelController::class, 'indexUsers']);
    Route::post('/users/{id}/credentials', [PersonnelController::class, 'setCredentials']);
    Route::delete('/users/{id}/credentials', [PersonnelController::class, 'revokeCredentials']);
    Route::post('/users/{id}/active', [PersonnelController::class, 'setActive']);

    // Tab 2 — Postes
    Route::get('/postes', [PostesController::class, 'index']);
    Route::post('/postes', [PostesController::class, 'store']);
    Route::patch('/postes/{id}', [PostesController::class, 'update']);
    Route::delete('/postes/{id}', [PostesController::class, 'destroy']);

    // Reference data for the form dropdowns
    Route::get('/roles', [PersonnelController::class, 'rolesList']);
    Route::get('/services', [PersonnelController::class, 'servicesList']);

    // Doctors list — users with the Doctor role, scoped to establishment
    Route::get('/doctors', [PersonnelController::class, 'indexDoctors']);
});
