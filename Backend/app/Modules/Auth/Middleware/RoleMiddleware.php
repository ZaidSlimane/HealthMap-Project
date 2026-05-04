<?php

namespace App\Modules\Auth\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * Accepts one OR several roles. The user passes if they hold ANY of
     * them. Examples in routes:
     *
     *   ->middleware('role:Admin')              // exactly Admin
     *   ->middleware('role:Admin,Doctor')       // either Admin or Doctor
     *
     * @param  Closure(Request): (Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!Auth::check()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user = Auth::user();
        $allowed = array_filter(array_map('trim', $roles));

        if (empty($allowed)) {
            return response()->json(['message' => 'Forbidden: No role configured for this route.'], 403);
        }

        if (!$user->roles()->whereIn('role', $allowed)->exists()) {
            return response()->json([
                'message' => 'Forbidden: You do not have the required role.',
                'required_any_of' => array_values($allowed),
            ], 403);
        }

        return $next($request);
    }
}
