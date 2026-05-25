<?php

namespace Database\Seeders;

use App\Modules\Auth\Models\Permission;
use App\Modules\Auth\Models\Role;
use Illuminate\Database\Seeder;

class RbacHierarchySeeder extends Seeder
{
    /**
     * Seed the RBAC hierarchy with permissions.
     *
     * Role hierarchy (adjacency list via parent_id):
     *
     *   Admin (no parent — global wildcard via admin.*)
     *   ├── Doctor (no parent — clinical domain)
     *   ├── ChefService (no parent — service management domain)
     *   │
     *   ├── LabHeadChief (lab domain root)
     *   │   └── LabTech
     *   │       └── LabAssistant
     *   │
     *   ├── RadioHeadChief (radiology domain root)
     *   │   └── RadioTech
     *   │
     *   └── Receptionist (standalone, no hierarchy)
     */
    public function run(): void
    {
        // ─── Create Permissions ────────────────────────────────────────────────

        $permissions = [
            // Admin wildcard
            ['name' => 'Admin Wildcard', 'slug' => 'admin.*'],

            // Lab permissions (granular)
            ['name' => 'View Lab Dashboard', 'slug' => 'lab.view_dashboard'],
            ['name' => 'View Lab Worklist', 'slug' => 'lab.view_worklist'],
            ['name' => 'Submit Lab Results', 'slug' => 'lab.submit_results'],
            ['name' => 'Approve Lab Results', 'slug' => 'lab.approve_results'],
            ['name' => 'Manage Lab Config', 'slug' => 'lab.manage_config'],
            ['name' => 'View Lab History', 'slug' => 'lab.view_history'],
            ['name' => 'Lab Wildcard', 'slug' => 'lab.*'],

            // Radiology permissions (granular)
            ['name' => 'View Radio Dashboard', 'slug' => 'radio.view_dashboard'],
            ['name' => 'View Radio Worklist', 'slug' => 'radio.view_worklist'],
            ['name' => 'Schedule Appointments', 'slug' => 'radio.schedule'],
            ['name' => 'Submit Radio Results', 'slug' => 'radio.submit_results'],
            ['name' => 'Manage Radio Config', 'slug' => 'radio.manage_config'],
            ['name' => 'Radio Wildcard', 'slug' => 'radio.*'],

            // Clinical permissions
            ['name' => 'View Patients', 'slug' => 'clinical.view_patients'],
            ['name' => 'Manage Admissions', 'slug' => 'clinical.manage_admissions'],
            ['name' => 'Create Consultations', 'slug' => 'clinical.create_consultations'],
            ['name' => 'Request Exams', 'slug' => 'clinical.request_exams'],
            ['name' => 'View Dossier', 'slug' => 'clinical.view_dossier'],
            ['name' => 'Clinical Wildcard', 'slug' => 'clinical.*'],

            // Service management
            ['name' => 'Manage Service', 'slug' => 'service.manage'],
            ['name' => 'Assign Doctors', 'slug' => 'service.assign_doctors'],
            ['name' => 'View Service Stats', 'slug' => 'service.view_stats'],

            // Pharmacy permissions
            ['name' => 'View Pharmacy Dashboard', 'slug' => 'pharmacy.view_dashboard'],
            ['name' => 'Manage Catalog', 'slug' => 'pharmacy.manage_catalog'],
            ['name' => 'Manage Orders', 'slug' => 'pharmacy.manage_orders'],
            ['name' => 'Manage Stock', 'slug' => 'pharmacy.manage_stock'],
            ['name' => 'Dispense Medication', 'slug' => 'pharmacy.dispense'],
            ['name' => 'Pharmacy Wildcard', 'slug' => 'pharmacy.*'],
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['slug' => $perm['slug']], $perm);
        }

        // ─── Create/Update Roles with Hierarchy ────────────────────────────────

        // Top-level roles (no parent)
        $admin = Role::firstOrCreate(['role' => 'Admin']);
        $admin->update(['parent_id' => null]);

        $doctor = Role::firstOrCreate(['role' => 'Doctor']);
        $doctor->update(['parent_id' => null]);

        $chefService = Role::firstOrCreate(['role' => 'ChefService']);
        $chefService->update(['parent_id' => null]);

        $receptionist = Role::firstOrCreate(['role' => 'Receptionist']);
        $receptionist->update(['parent_id' => null]);

        // Lab hierarchy: LabHeadChief → LabTech → LabAssistant
        $labHeadChief = Role::firstOrCreate(['role' => 'LabHeadChief']);
        $labHeadChief->update(['parent_id' => null]);

        $labTech = Role::firstOrCreate(['role' => 'LabTech']);
        $labTech->update(['parent_id' => $labHeadChief->id]);

        $labAssistant = Role::firstOrCreate(['role' => 'LabAssistant']);
        $labAssistant->update(['parent_id' => $labTech->id]);

        // Radio hierarchy: RadioHeadChief → RadioTech
        $radioHeadChief = Role::firstOrCreate(['role' => 'RadioHeadChief']);
        $radioHeadChief->update(['parent_id' => null]);

        $radioTech = Role::firstOrCreate(['role' => 'RadioTech']);
        $radioTech->update(['parent_id' => $radioHeadChief->id]);

        // Pharmacy - standalone role
        $pharmacist = Role::firstOrCreate(['role' => 'Pharmacien']);
        $pharmacist->update(['parent_id' => null]);

        // ─── Assign Permissions to Roles ───────────────────────────────────────

        // Admin gets the global wildcard
        $this->syncPermissions($admin, ['admin.*']);

        // Doctor gets clinical permissions
        $this->syncPermissions($doctor, [
            'clinical.view_patients',
            'clinical.manage_admissions',
            'clinical.create_consultations',
            'clinical.request_exams',
            'clinical.view_dossier',
        ]);

        // ChefService gets service management + clinical
        $this->syncPermissions($chefService, [
            'service.manage',
            'service.assign_doctors',
            'service.view_stats',
            'clinical.view_patients',
            'clinical.view_dossier',
        ]);

        // Lab Head Chief gets lab wildcard (inherits everything below too)
        $this->syncPermissions($labHeadChief, [
            'lab.*',
        ]);

        // Lab Tech gets operational permissions (Head Chief inherits these)
        $this->syncPermissions($labTech, [
            'lab.view_dashboard',
            'lab.view_worklist',
            'lab.submit_results',
            'lab.view_history',
        ]);

        // Lab Assistant gets view-only permissions (Lab Tech inherits these)
        $this->syncPermissions($labAssistant, [
            'lab.view_dashboard',
            'lab.view_worklist',
        ]);

        // Radio Head Chief gets radio wildcard
        $this->syncPermissions($radioHeadChief, [
            'radio.*',
        ]);

        // Radio Tech gets operational permissions
        $this->syncPermissions($radioTech, [
            'radio.view_dashboard',
            'radio.view_worklist',
            'radio.schedule',
            'radio.submit_results',
        ]);

        // Pharmacist gets pharmacy wildcard
        $this->syncPermissions($pharmacist, [
            'pharmacy.*',
        ]);

        $this->command->info('RBAC hierarchy seeded successfully.');
        $this->command->table(
            ['Role', 'Parent', 'Direct Permissions'],
            Role::all()->map(fn ($r) => [
                $r->role,
                $r->parent?->role ?? '—',
                $r->permissions()->pluck('slug')->implode(', ') ?: '—',
            ])->toArray()
        );
    }

    private function syncPermissions(Role $role, array $slugs): void
    {
        $permissionIds = Permission::whereIn('slug', $slugs)->pluck('id');
        $role->permissions()->sync($permissionIds);
    }
}
