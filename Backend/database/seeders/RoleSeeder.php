<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Modules\Auth\Models\Role;

/**
 * Canonical role names. The frontend MUST use these strings exactly when
 * checking roles — comparisons in `RoleMiddleware` are case-sensitive.
 *
 * Mapping for the legacy frontend literals:
 *   - 'superadmin'   → not a separate role; an Admin without an
 *                       establishment_id behaves as a global super-admin
 *                       (see BelongsToEstablishment::currentEstablishmentId).
 *   - 'medecin' / 'consultation' → 'Doctor'.
 *   - 'bde'                       → 'BDE'.
 *   - 'pharmacie'                 → 'Pharmacy'.
 *   - 'service' / reception desk  → 'Reception'.
 */
class RoleSeeder extends Seeder
{
    public const ROLES = [
        'Admin',      // Establishment administrator (configuration + management)
        'Doctor',     // Clinical staff (consultations, prescriptions, observations)
        'BDE',        // Bureau des Entrées (patient registration, admissions intake)
        'Pharmacy',   // Pharmacy desk (dispense prescriptions)
        'Reception',  // Reception / borne d'accueil
    ];

    public function run(): void
    {
        foreach (self::ROLES as $role) {
            Role::firstOrCreate(['role' => $role]);
        }
    }
}
