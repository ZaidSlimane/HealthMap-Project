<?php

use Illuminate\Support\Facades\Route;
use App\Modules\ClinicalCore\Controllers\AdmissionController;
use App\Modules\ClinicalCore\Controllers\BedController;
use App\Modules\ClinicalCore\Controllers\BorneController;
use App\Modules\ClinicalCore\Controllers\CompanionController;
use App\Modules\ClinicalCore\Controllers\ConsultationController;
use App\Modules\ClinicalCore\Controllers\ConsultationSymptomController;
use App\Modules\ClinicalCore\Controllers\CountryController;
use App\Modules\ClinicalCore\Controllers\EstablishmentTypeController;
use App\Modules\ClinicalCore\Controllers\EstablishmentUnitController;
use App\Modules\ClinicalCore\Controllers\IdentityDocumentController;
use App\Modules\ClinicalCore\Controllers\MaritalStatusController;
use App\Modules\ClinicalCore\Controllers\MedicalDocumentController;
use App\Modules\ClinicalCore\Controllers\MunicipalityController;
use App\Modules\ClinicalCore\Controllers\ObservationController;
use App\Modules\ClinicalCore\Controllers\PatientController;
use App\Modules\ClinicalCore\Controllers\PrescriptionController;
use App\Modules\ClinicalCore\Controllers\PrescriptionMedicationController;
use App\Modules\ClinicalCore\Controllers\ProvinceController;
use App\Modules\ClinicalCore\Controllers\RoomController;
use App\Modules\ClinicalCore\Controllers\ServiceController;
use App\Modules\ClinicalCore\Controllers\ServiceTypeController;
use App\Modules\ClinicalCore\Controllers\WaitingListController;

/*
|--------------------------------------------------------------------------
| ClinicalCore API
|--------------------------------------------------------------------------
| Endpoints are split by responsibility so the same role names that gate
| the sidebar in the frontend also gate the data on the server.
|
|   - Admin only            → tenant configuration (services, units, beds,
|                              rooms, types, reference data).
|   - Reference (any role)  → dropdown lookups any logged-in user needs
|                              (countries, provinces, marital statuses…).
|   - Clinical (Doctor+Admin)
|                           → patients, admissions, consultations and the
|                              full medical record graph.
|   - Front desk (BDE+Admin)
|                           → admission intake, waiting lists, companions.
|
| Hiding routes in the UI is not enough; the server enforces the same
| policy here so a forged URL request still returns 403.
*/

Route::middleware(['auth'])->group(function () {

    // ── Admin-only: tenant configuration ────────────────────────────
    Route::middleware('role:Admin')->group(function () {
        Route::apiResource('establishment-types', EstablishmentTypeController::class);
        Route::apiResource('establishment-units', EstablishmentUnitController::class);
        Route::apiResource('services', ServiceController::class);
        Route::apiResource('service-types', ServiceTypeController::class);
        Route::apiResource('rooms', RoomController::class);
        Route::apiResource('beds', BedController::class);
        Route::apiResource('bornes', BorneController::class);
    });

    // ── Reference data: any authenticated user needs these dropdowns ─
    Route::middleware('role:Admin,Doctor,BDE,Pharmacy,Reception')->group(function () {
        Route::apiResource('countries', CountryController::class)->only(['index', 'show']);
        Route::apiResource('provinces', ProvinceController::class)->only(['index', 'show']);
        Route::apiResource('municipalities', MunicipalityController::class)->only(['index', 'show']);
        Route::apiResource('marital-statuses', MaritalStatusController::class)->only(['index', 'show']);
        Route::apiResource('identity-documents', IdentityDocumentController::class)->only(['index', 'show']);
    });

    // Reference data writes (rare; gated to Admin).
    Route::middleware('role:Admin')->group(function () {
        Route::apiResource('countries', CountryController::class)->except(['index', 'show']);
        Route::apiResource('provinces', ProvinceController::class)->except(['index', 'show']);
        Route::apiResource('municipalities', MunicipalityController::class)->except(['index', 'show']);
        Route::apiResource('marital-statuses', MaritalStatusController::class)->except(['index', 'show']);
        Route::apiResource('identity-documents', IdentityDocumentController::class)->except(['index', 'show']);
    });

    // ── Front desk: admission intake & companions ────────────────────
    Route::middleware('role:Admin,BDE,Reception')->group(function () {
        Route::apiResource('companions', CompanionController::class);
        Route::apiResource('waiting-lists', WaitingListController::class);
    });

    // ── Clinical: doctors and admins. Patients are co-managed by BDE
    //            for registration so they're allowed in too. ─────────
    Route::middleware('role:Admin,Doctor,BDE')->group(function () {
        Route::apiResource('patients', PatientController::class);
        Route::apiResource('admissions', AdmissionController::class);
    });

    // Pure clinical: write privilege only for doctors (and Admin for ops).
    Route::middleware('role:Admin,Doctor')->group(function () {
        Route::apiResource('consultations', ConsultationController::class);
        Route::apiResource('consultation-symptoms', ConsultationSymptomController::class);
        Route::apiResource('prescriptions', PrescriptionController::class);
        Route::apiResource('prescription-medications', PrescriptionMedicationController::class);
        Route::apiResource('medical-documents', MedicalDocumentController::class);
        Route::apiResource('observations', ObservationController::class);
    });
});
