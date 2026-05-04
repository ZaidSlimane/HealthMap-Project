<?php

namespace App\Modules\Auth\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auth\Models\User;
use App\Modules\Auth\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Handle the root password login for Admin.
     */
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        // 1) Bootstrap shortcut for the seeded admin (kept for back-compat).
        if ($request->username === 'Admin' && $request->password === 'root') {
            return $this->authenticateAdmin();
        }

        // 2) Real users: look up by `username` (set from the Utilisateurs tab).
        $user = User::where('username', $request->username)
            ->where('is_active', true)
            ->first();

        if ($user && Hash::check($request->password, $user->password)) {
            Auth::login($user);
            return response()->json([
                'message' => 'Authenticated successfully.',
                'user' => $this->presentUser($user),
            ]);
        }

        throw ValidationException::withMessages([
            'username' => ['The provided credentials do not match our records.'],
        ]);
    }

    /**
     * Authenticate the admin user, ensure persistence, and assign role.
     */
    protected function authenticateAdmin()
    {
        // Find or create the Admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@healthmap.com'],
            [
                'name' => 'Administrator',
                'email' => 'admin@healthmap.com',
                'password' => Hash::make('root'),
                // Force the bootstrap admin through the onboarding wizard the
                // first time they sign in.
                'must_change_password' => true,
            ]
        );

        // Ensure the "Admin" role is assigned
        $adminRole = Role::firstOrCreate(['role' => 'Admin']);
        $admin->roles()->syncWithoutDetaching([$adminRole->id]);

        Auth::login($admin);

        return response()->json([
            'message' => 'Authenticated successfully as Admin.',
            'user' => $this->presentUser($admin),
        ]);
    }

    /**
     * Return the currently authenticated user, hydrated with onboarding state.
     */
    public function me(Request $request)
    {
        return response()->json($this->presentUser($request->user()));
    }

    /**
     * Change the user's password. Used both during onboarding (when
     * must_change_password=true) and as a regular settings action.
     */
    public function changePassword(Request $request)
    {
        // The frontend confirms `new_password` on its side, so we only
        // receive the single field here.
        $data = $request->validate([
            'current_password' => 'required|string',
            'new_password' => ['required', 'string', Password::min(8)],
        ]);

        $user = $request->user();

        if (!Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->forceFill([
            'password' => Hash::make($data['new_password']),
            'must_change_password' => false,
            'password_changed_at' => now(),
        ])->save();

        return response()->json([
            'message' => 'Password changed successfully.',
            'user' => $this->presentUser($user->fresh()),
        ]);
    }

    /**
     * Log the user out of the application.
     */
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * Standard user payload returned from /login, /me, /change-password.
     *
     * Multi-role: a user can hold any combination of roles. The response
     * exposes both the full pivot collection (`roles`) and a flat array
     * of role names (`role_names`) — the frontend should use the latter
     * for guards/sidebar filtering and only fall back to `roles` when it
     * needs role metadata.
     *
     * Specialization: a Doctor's clinical assignment is exposed via
     * `service` (BelongsTo Service), `poste` (BelongsTo Poste) and
     * `is_consultant` so the UI can filter service-specific routes
     * (/services/cardio, /consultation/<svc>, etc.) to the doctor's
     * own service instead of a hardcoded list.
     */
    protected function presentUser(User $user): array
    {
        $user->load([
            'roles',
            'establishment.type',
            'establishment.province',
            'service:id,name,code,service_type_id',
            'service.type:id,code,label',
            'poste:id,label,label_ar',
        ]);

        $roleNames = $user->roles->pluck('role')->values()->all();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'first_name' => $user->first_name,
            'email' => $user->email,
            'username' => $user->username,
            'matricule' => $user->matricule,
            'is_active' => (bool) $user->is_active,
            'is_consultant' => (bool) $user->is_consultant,
            // Roles
            'roles' => $user->roles,
            'role_names' => $roleNames,
            // Specialization (null for non-clinical staff)
            'service' => $user->service,
            'poste' => $user->poste,
            // Auth lifecycle
            'must_change_password' => (bool) $user->must_change_password,
            'onboarding_completed_at' => $user->onboarding_completed_at,
            'onboarding_completed' => $user->hasCompletedOnboarding(),
            'establishment' => $user->establishment,
        ];
    }
}
