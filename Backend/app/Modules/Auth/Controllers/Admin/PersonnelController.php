<?php

namespace App\Modules\Auth\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Modules\Auth\Models\Role;
use App\Modules\Auth\Models\User;
use App\Modules\ClinicalCore\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * Backs the three tabs of the "Personnel & Utilisateurs" page.
 *
 *   Tab 0 — Personnel:    GET /personnel, POST, PATCH, DELETE
 *   Tab 1 — Utilisateurs: GET /users (rows with username),
 *                         POST /users/{id}/credentials  (grant or rotate),
 *                         DELETE /users/{id}/credentials  (revoke login)
 *   Tab 2 — Postes:       full CRUD via PostesController.
 *
 * Personnel and Users are the same table (Option A). The Utilisateurs view
 * is just the subset that has a username.
 */
class PersonnelController extends Controller
{
    /**
     * Tenant scope for User queries.
     *
     * - Establishment admin (has establishment_id): sees only users of their
     *   own establishment.
     * - Bootstrap super-admin (establishment_id = NULL): sees everyone, used
     *   for future geo-monitoring.
     */
    protected function tenantQuery(): \Illuminate\Database\Eloquent\Builder
    {
        $query = User::query();
        $estId = auth()->user()?->establishment_id;
        if ($estId !== null) {
            $query->where('users.establishment_id', $estId);
        }
        return $query;
    }

    /**
     * Establishment_id to stamp on newly-created users. Bootstrap admin
     * has none and therefore can't create personnel — guarded by callers.
     */
    protected function currentEstablishmentId(): ?int
    {
        return auth()->user()?->establishment_id;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Tab 0 — Personnel
    // ─────────────────────────────────────────────────────────────────────

    public function indexPersonnel(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 25);
        $q = trim((string) $request->query('q', ''));

        $query = $this->tenantQuery()
            ->with(['poste:id,label,label_ar', 'service:id,name', 'roles:id,role'])
            ->orderBy('id', 'desc');

        if ($q !== '') {
            $query->where(function ($w) use ($q) {
                $w->where('matricule', 'like', "%{$q}%")
                    ->orWhere('name', 'like', "%{$q}%")
                    ->orWhere('first_name', 'like', "%{$q}%")
                    ->orWhere('name_ar', 'like', "%{$q}%")
                    ->orWhere('first_name_ar', 'like', "%{$q}%");
            });
        }

        return response()->json($query->paginate($perPage));
    }

    public function storePersonnel(Request $request): JsonResponse
    {
        $data = $this->validatePersonnel($request);
        $roleIds = $request->input('role_ids');
        $serviceIds = $request->input('service_ids');

        $data['establishment_id'] = $this->currentEstablishmentId();

        $user = User::create($data);

        if (is_array($roleIds)) {
            $user->roles()->sync($roleIds);
        }

        // Sync many-to-many services for doctors
        if (is_array($serviceIds)) {
            $user->services()->sync($serviceIds);
        }

        return response()->json(
            $user->load(['poste:id,label,label_ar', 'service:id,name', 'services:id,name', 'roles:id,role']),
            201
        );
    }

    public function updatePersonnel(Request $request, int $id): JsonResponse
    {
        $user = $this->tenantQuery()->findOrFail($id);
        $data = $this->validatePersonnel($request, $id);
        $roleIds = $request->input('role_ids');

        $user->fill($data)->save();

        if (is_array($roleIds)) {
            $user->roles()->sync($roleIds);
        }

        return response()->json(
            $user->fresh()->load(['poste:id,label,label_ar', 'service:id,name', 'roles:id,role'])
        );
    }

    public function destroyPersonnel(int $id): JsonResponse
    {
        // Prevent self-delete and cross-tenant access.
        $user = $this->tenantQuery()->findOrFail($id);
        if (auth()->id() === $user->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }
        $user->delete();
        return response()->json(null, 204);
    }

    /**
     * Tab 0 → write rules. Username/password are not part of this form;
     * those are managed from Tab 1 via the credentials endpoint.
     */
    protected function validatePersonnel(Request $request, ?int $id = null): array
    {
        return $request->validate([
            'matricule' => 'nullable|string|max:60',
            'name' => 'nullable|string|max:120',         // nom (laqab fr)
            'first_name' => 'nullable|string|max:120',   // prenom (ism fr)
            'name_ar' => 'nullable|string|max:120',      // laqab (ar)
            'first_name_ar' => 'nullable|string|max:120',// ism (ar)
            'poste_id' => 'nullable|integer|exists:postes,id',
            'service_id' => 'nullable|integer|exists:services,id',
            'is_consultant' => 'sometimes|boolean',
            'email' => [
                'nullable', 'email', 'max:180',
                Rule::unique('users', 'email')->ignore($id),
            ],
            'role_ids' => 'sometimes|array',
            'role_ids.*' => 'integer|exists:roles,id',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Tab 1 — Utilisateurs
    // ─────────────────────────────────────────────────────────────────────

    public function indexUsers(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 25);
        $q = trim((string) $request->query('q', ''));
        $threshold = time() - 300; // 5 min

        // Joins sessions to surface a single online flag per user without an
        // N+1. We aggregate the latest last_activity per user_id.
        $query = $this->tenantQuery()
            ->with(['roles:id,role', 'poste:id,label,label_ar'])
            ->whereNotNull('username')
            ->leftJoinSub(
                DB::table('sessions')
                    ->select('user_id', DB::raw('MAX(last_activity) as last_activity'))
                    ->whereNotNull('user_id')
                    ->groupBy('user_id'),
                'sx',
                'sx.user_id', '=', 'users.id'
            )
            ->select(
                'users.*',
                DB::raw("COALESCE(sx.last_activity, 0) as last_activity"),
                DB::raw("CASE WHEN sx.last_activity IS NOT NULL AND sx.last_activity >= {$threshold} THEN 1 ELSE 0 END as online")
            )
            ->orderBy('users.id', 'desc');

        if ($q !== '') {
            $query->where(function ($w) use ($q) {
                $w->where('username', 'like', "%{$q}%")
                    ->orWhere('name', 'like', "%{$q}%")
                    ->orWhere('first_name', 'like', "%{$q}%");
            });
        }

        return response()->json($query->paginate($perPage));
    }

    /**
     * Promote a personnel row to a user, or rotate an existing user's
     * credentials. Body: { username, password (>=8), role_ids: number[] }.
     */
    public function setCredentials(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'username' => [
                'required', 'string', 'min:3', 'max:60',
                Rule::unique('users', 'username')->ignore($id),
            ],
            'password' => 'required|string|min:8',
            'role_ids' => 'sometimes|array',
            'role_ids.*' => 'integer|exists:roles,id',
            'must_change_password' => 'sometimes|boolean',
        ]);

        $user = $this->tenantQuery()->findOrFail($id);
        $user->forceFill([
            'username' => $data['username'],
            'password' => Hash::make($data['password']),
            'must_change_password' => $data['must_change_password'] ?? true,
            'is_active' => true,
        ])->save();

        if (array_key_exists('role_ids', $data)) {
            $user->roles()->sync($data['role_ids']);
        }

        return response()->json(
            $user->fresh()->load(['roles:id,role', 'poste:id,label,label_ar'])
        );
    }

    /**
     * Revoke login (clears username + password). The personnel record stays.
     */
    public function revokeCredentials(int $id): JsonResponse
    {
        $user = $this->tenantQuery()->findOrFail($id);
        if (auth()->id() === $user->id) {
            return response()->json(['message' => 'You cannot revoke your own credentials.'], 422);
        }
        $user->forceFill([
            'username' => null,
            'password' => Hash::make(\Illuminate\Support\Str::random(40)),
            'is_active' => false,
        ])->save();
        $user->roles()->detach();
        return response()->json(null, 204);
    }

    /**
     * Soft on/off switch separate from credential revocation. Useful when
     * an account is temporarily disabled (vacation, suspension).
     */
    public function setActive(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['is_active' => 'required|boolean']);
        $user = $this->tenantQuery()->findOrFail($id);
        $user->forceFill(['is_active' => $data['is_active']])->save();
        return response()->json($user);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Doctors list
    // ─────────────────────────────────────────────────────────────────────

    /**
     * List all users with the "Doctor" role for the current establishment.
     * Returns: name, service, poste, is_consultant, is_active.
     */
    public function indexDoctors(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 50);

        $query = $this->tenantQuery()
            ->with(['service:id,name', 'services:id,name', 'poste:id,label,label_ar', 'establishment:id,name'])
            ->whereHas('roles', fn($q) => $q->where('role', 'Doctor'))
            ->orderBy('name');

        return response()->json($query->paginate($perPage));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Reference lists (used by the form dropdowns)
    // ─────────────────────────────────────────────────────────────────────

    public function rolesList(): JsonResponse
    {
        return response()->json(Role::orderBy('id')->get(['id', 'role']));
    }

    public function servicesList(): JsonResponse
    {
        return response()->json(
            Service::orderBy('name')->get(['id', 'name'])
        );
    }
}
