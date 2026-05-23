<?php

namespace App\Modules\Auth\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class PermissionMiddleware
{
    /**
     * Handle an incoming request by checking if the user has the required permission.
     *
     * Supports:
     *   ->middleware('permission:lab.view_worklist')         // single permission
     *   ->middleware('permission:lab.submit_results,lab.view_worklist')  // any of these
     *
     * Permission resolution includes:
     *   - Direct user permissions (permission_user pivot)
     *   - Role permissions (permission_role pivot)
     *   - Hierarchical inheritance (parent roles inherit children's permissions)
     *   - Wildcard implication ("lab.*" implies "lab.view_worklist")
     *
     * @param  Closure(Request): (Response)  $next
     * @param  string  ...$permissions
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        if (!Auth::check()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user = Auth::user();
        $required = array_filter(array_map('trim', $permissions));

        if (empty($required)) {
            return response()->json(['message' => 'Forbidden: No permission configured for this route.'], 403);
        }

        // User passes if they have ANY of the required permissions
        foreach ($required as $permission) {
            if ($user->hasPermission($permission)) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Forbidden: You do not have the required permission.',
            'required_any_of' => array_values($required),
        ], 403);
    }
}
