<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            // Auth uses Laravel's session guard (Auth::login + $request->session()),
            // so it must run under the 'web' middleware group, not 'api'.
            Route::middleware('web')
                ->prefix('api/auth')
                ->group(base_path('routes/modules/auth.php'));

            Route::middleware('web')
                ->prefix('api/clinical-core')
                ->group(base_path('routes/modules/clinical_core.php'));

            Route::middleware('web')
                ->prefix('api/onboarding')
                ->group(base_path('routes/modules/onboarding.php'));

            Route::middleware('web')
                ->prefix('api/admin')
                ->group(base_path('routes/modules/admin.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Modules\Auth\Middleware\RoleMiddleware::class,
        ]);

        // Auth endpoints are consumed as JSON APIs, not browser forms.
        $middleware->validateCsrfTokens(except: [
            'api/auth/*',
            'api/clinical-core/*',
            'api/onboarding/*',
            'api/admin/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
