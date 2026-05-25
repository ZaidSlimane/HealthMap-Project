<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Pharmacy\Controllers\PharmacyDashboardController;
use App\Modules\Pharmacy\Controllers\DciController;
use App\Modules\Pharmacy\Controllers\ProduitController;
use App\Modules\Pharmacy\Controllers\FournisseurController;
use App\Modules\Pharmacy\Controllers\CommandeController;
use App\Modules\Pharmacy\Controllers\StockController;

/*
|--------------------------------------------------------------------------
| Pharmacy Module Routes
|--------------------------------------------------------------------------
|
| All routes protected by role:pharmacien middleware (applied in RouteServiceProvider)
|
*/

Route::prefix('pharmacy')->group(function () {

    // Dashboard
    Route::get('dashboard', [PharmacyDashboardController::class, 'index']);

    // DCI
    Route::get('dci/search-national', [DciController::class, 'searchNational']);
    Route::apiResource('dci', DciController::class);

    // Fournisseurs
    Route::apiResource('fournisseurs', FournisseurController::class);

    // Produits
    Route::apiResource('produits', ProduitController::class);
    Route::get('produits-alerts', [ProduitController::class, 'index'])->defaults('alerts', true);

    // Commandes
    Route::apiResource('commandes', CommandeController::class);
    Route::post('commandes/{id}/receive', [CommandeController::class, 'receive']);

    // Stock
    Route::get('stock', [StockController::class, 'index']);
    Route::put('stock/{id}/adjust', [StockController::class, 'adjust']);
    Route::put('stock/{id}/thresholds', [StockController::class, 'updateThresholds']);
    Route::get('stock/{produitId}/movements', [StockController::class, 'movements']);

});
