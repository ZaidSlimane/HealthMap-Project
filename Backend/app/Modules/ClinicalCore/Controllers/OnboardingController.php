<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auth\Models\Role;
use App\Modules\Auth\Models\User;
use App\Modules\ClinicalCore\Models\Establishment;
use App\Modules\ClinicalCore\Models\EstablishmentType;
use App\Modules\ClinicalCore\Models\Province;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class OnboardingController extends Controller
{
    /**
     * GET /api/onboarding/wilayas
     * Public to authenticated users — drives the wizard's wilaya picker.
     */
    public function wilayas()
    {
        return Province::query()
            ->whereNotNull('code')
            ->orderBy('code')
            ->get(['id', 'code', 'name']);
    }

    /**
     * GET /api/onboarding/establishment-types
     */
    public function establishmentTypes()
    {
        return EstablishmentType::query()
            ->whereNotNull('code')
            ->orderBy('id')
            ->get(['id', 'code', 'label']);
    }

    /**
     * GET /api/onboarding/establishments?wilaya_code=25&type=CHU
     * Both filters optional; the wizard typically sends both.
     */
    public function establishments(Request $request)
    {
        $filters = $request->validate([
            'wilaya_code' => 'nullable|integer|min:1|max:99',
            'type' => 'nullable|string|max:32',
            'q' => 'nullable|string|max:120',
        ]);

        $query = Establishment::query()
            ->where('status', 'active')
            ->with(['type:id,code,label', 'province:id,code,name']);

        if (!empty($filters['wilaya_code'])) {
            $query->whereHas('province', fn ($q) => $q->where('code', $filters['wilaya_code']));
        }

        if (!empty($filters['type'])) {
            $query->whereHas('type', fn ($q) => $q->where('code', $filters['type']));
        }

        if (!empty($filters['q'])) {
            $query->where('name', 'like', '%' . $filters['q'] . '%');
        }

        return $query->orderBy('name')->limit(500)->get([
            'id', 'slug', 'name', 'name_ar',
            'establishment_type_id', 'province_id', 'source',
        ]);
    }

    /**
     * POST /api/onboarding/establishments
     * Used when the user's establishment isn't in the seeded directory.
     * Creates a `source=custom` row and returns it (frontend then proceeds
     * with its slug as the establishment_id).
     */
    public function createEstablishment(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|min:2|max:180',
            'name_ar' => 'nullable|string|max:180',
            'type' => 'required|string|exists:establishment_types,code',
            'wilaya_code' => 'required|integer|exists:provinces,code',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:32',
            'email' => 'nullable|email|max:180',
        ]);

        $type = EstablishmentType::where('code', $data['type'])->firstOrFail();
        $province = Province::where('code', $data['wilaya_code'])->firstOrFail();

        $slug = $this->uniqueSlug($data['name']);

        $est = Establishment::create([
            'slug' => $slug,
            'name' => $data['name'],
            'name_ar' => $data['name_ar'] ?? null,
            'establishment_type_id' => $type->id,
            'province_id' => $province->id,
            'address' => $data['address'] ?? null,
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'source' => 'custom',
            'status' => 'active',
            'created_by' => $request->user()?->id,
        ]);

        return response()->json(
            $est->load(['type:id,code,label', 'province:id,code,name']),
            201
        );
    }

    /**
     * POST /api/onboarding/complete
     *
     * Body: { establishment_type, wilaya_code, establishment_id (slug), new_password }
     *
     * Acting user must be the bootstrap admin (Admin/root) — i.e. a user with
     * the Admin role and no establishment yet. We then:
     *   1. Validate the establishment trio.
     *   2. Reject if the establishment already has an admin (already onboarded).
     *   3. Create a brand-new dedicated admin user for the establishment, with
     *      the password they typed.
     *   4. Link establishments.admin_user_id to it.
     *   5. Reset the bootstrap account's password to 'root' so the next
     *      establishment can use the same backdoor to onboard.
     *   6. Switch the session from the bootstrap user to the new admin.
     */
    public function complete(Request $request)
    {
        $data = $request->validate([
            'establishment_type' => 'required|string|exists:establishment_types,code',
            'wilaya_code' => 'required|integer|exists:provinces,code',
            'establishment_id' => 'required|string|exists:establishments,slug',
            'new_password' => ['required', 'string', Password::min(8)],
        ]);

        /** @var User $bootstrap */
        $bootstrap = $request->user();

        // The bootstrap account is identified by NOT having an establishment
        // yet. A user already linked to an establishment cannot re-onboard.
        if ($bootstrap->establishment_id !== null) {
            return response()->json([
                'message' => 'This account is already linked to an establishment.',
            ], 409);
        }

        $est = Establishment::where('slug', $data['establishment_id'])
            ->with(['type', 'province'])
            ->firstOrFail();

        // The establishment can only be claimed once.
        if ($est->admin_user_id !== null) {
            throw ValidationException::withMessages([
                'establishment_id' => ['This establishment has already been onboarded.'],
            ]);
        }

        // Sanity-check the type/wilaya match the chosen establishment.
        if ($est->province->code !== (int) $data['wilaya_code']) {
            throw ValidationException::withMessages([
                'wilaya_code' => ["Establishment does not belong to wilaya {$data['wilaya_code']}."],
            ]);
        }

        if ($est->source === 'seeded' && $est->type->code !== $data['establishment_type']) {
            throw ValidationException::withMessages([
                'establishment_type' => ["Establishment is not of type {$data['establishment_type']}."],
            ]);
        }

        $newAdmin = DB::transaction(function () use ($est, $bootstrap, $data) {
            $adminRole = Role::firstOrCreate(['role' => 'Admin']);

            // Create the dedicated admin user for this establishment.
            $newAdmin = User::create([
                'name' => 'Administrator (' . $est->name . ')',
                'email' => 'admin@' . $est->slug . '.local',
                'username' => 'admin-' . $est->slug,
                'password' => Hash::make($data['new_password']),
                'establishment_id' => $est->id,
                'is_active' => true,
                'must_change_password' => false,
                'password_changed_at' => now(),
                'onboarding_completed_at' => now(),
            ]);

            $newAdmin->roles()->sync([$adminRole->id]);

            // Wire the establishment → admin pointer.
            $est->forceFill(['admin_user_id' => $newAdmin->id])->save();

            // Restore the bootstrap account's password so the *next* admin
            // can onboard a different establishment with Admin/root.
            $bootstrap->forceFill([
                'password' => Hash::make('root'),
                'must_change_password' => true,
            ])->save();

            return $newAdmin;
        });

        // Switch the active session: log the bootstrap user out, log the new
        // establishment admin in.
        Auth::logout();
        $request->session()->regenerate();
        Auth::login($newAdmin);

        return response()->json([
            'message' => 'Onboarding completed. Welcome, ' . $est->name . '.',
            'establishment' => $est->fresh(['type', 'province', 'admin']),
            'user' => $newAdmin->load(['roles', 'establishment']),
        ]);
    }

    /**
     * Generate a unique slug for a custom establishment, falling back to
     * `-2`, `-3`, … on collision.
     */
    protected function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        if ($base === '') {
            $base = 'etablissement';
        }
        $slug = $base;
        $i = 2;
        while (Establishment::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }
        return $slug;
    }
}
