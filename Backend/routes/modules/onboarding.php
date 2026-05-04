<?php

use App\Modules\ClinicalCore\Controllers\OnboardingController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    // Reference data — drives the wizard's pickers.
    Route::get('/wilayas', [OnboardingController::class, 'wilayas']);
    Route::get('/establishment-types', [OnboardingController::class, 'establishmentTypes']);

    // Establishments directory + custom creation.
    Route::get('/establishments', [OnboardingController::class, 'establishments']);
    Route::post('/establishments', [OnboardingController::class, 'createEstablishment']);

    // Wizard finalization.
    Route::post('/complete', [OnboardingController::class, 'complete']);
});
