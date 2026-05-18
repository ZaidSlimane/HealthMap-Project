# Tasks

## Task 1: Database Schema Extensions

Create the migration and seed the ChefService role.

- [x] Create migration file `Backend/database/migrations/2026_05_16_000001_chef_de_service_schema.php` that:
  - Adds `is_chef` boolean column (default false) to `service_user` table after `service_id`
  - Adds `label_fr` nullable string column to `bornes` table after `name`
  - Adds `type` string(20) column (default 'consultation') to `bornes` table after `label_fr`
  - Adds `is_active` boolean column (default true) to `bornes` table after `type`
  - Adds `service_id` nullable foreign key to `bornes` table referencing `services`, nullOnDelete
  - Creates `doctor_shift_assignments` table with columns: `id`, `user_id` (FK users, cascadeOnDelete), `service_id` (FK services, cascadeOnDelete), `borne_id` (FK bornes, cascadeOnDelete), `day_of_week` (json), `start_time` (time), `end_time` (time), `assigned_by` (FK users, cascadeOnDelete), `is_active` (boolean, default true), timestamps
  - Adds composite indexes on `[service_id, borne_id]` and `[user_id, is_active]` for doctor_shift_assignments
  - Implements proper `down()` method to reverse all changes
- [x] Add `ChefService` role to the roles seeder: use `Role::firstOrCreate(['role' => 'ChefService'])` in `Backend/database/seeders/DatabaseSeeder.php` or the appropriate role seeder

## Task 2: Backend Models and Relationships

Create the DoctorShiftAssignment model and extend existing models with new relationships.

- [x] Create `Backend/app/Modules/ChefService/Models/DoctorShiftAssignment.php` with:
  - Namespace `App\Modules\ChefService\Models`
  - Fillable: `user_id`, `service_id`, `borne_id`, `day_of_week`, `start_time`, `end_time`, `assigned_by`, `is_active`
  - Casts: `day_of_week` as array, `is_active` as boolean, `start_time` as `datetime:H:i`, `end_time` as `datetime:H:i`
  - Relationships: `user()`, `service()`, `borne()`, `assignedBy()`
- [x] Update `Backend/app/Modules/ClinicalCore/Models/Borne.php`:
  - Add `label_fr`, `type`, `is_active`, `service_id` to `$fillable`
  - Add `casts()` method with `is_active` as boolean
  - Add `service()` BelongsTo relationship
  - Add `activeAssignments()` HasMany relationship (DoctorShiftAssignment where is_active = true)
  - Add `assignedDoctor()` HasOne relationship (latest active assignment with user eager-loaded)
  - Add required use statements for `HasMany`, `HasOne`, `BelongsTo`
- [x] Update `Backend/app/Modules/Auth/Models/User.php`:
  - Modify `services()` relationship to include `->withPivot('is_chef')`

## Task 3: Backend ServiceScopeTrait and FormRequests

Create the service-scoping trait and validation request classes.

- [x] Create `Backend/app/Modules/ChefService/Traits/ServiceScopeTrait.php` with:
  - `chefServiceId(): int` — resolves the authenticated user's chef service ID from `service_user` pivot where `is_chef = true`, aborts 403 if not found
  - `authorizeServiceAccess(int $serviceId): void` — aborts 403 if provided serviceId doesn't match chef's service
- [x] Create `Backend/app/Modules/ChefService/Requests/StoreBoxRequest.php` with rules: `label_ar` required string min:1, `label_fr` required string min:1, `type` required in:consultation,observation,urgence, `is_active` boolean
- [x] Create `Backend/app/Modules/ChefService/Requests/UpdateBoxRequest.php` with rules: all fields `sometimes` with same validation as store
- [x] Create `Backend/app/Modules/ChefService/Requests/StoreAssignmentRequest.php` with rules: `user_id` required exists:users,id, `day_of_week` required array min:1, `day_of_week.*` in:lundi,mardi,mercredi,jeudi,vendredi,samedi,dimanche, `start_time` required date_format:H:i, `end_time` required date_format:H:i after:start_time

## Task 4: Backend Controllers

Create the Chef de Service API controllers.

- [x] Create `Backend/app/Modules/ChefService/Controllers/DashboardController.php`:
  - Uses ServiceScopeTrait
  - Single `__invoke` method returning JSON with: `service_name`, `box_count`, `doctor_count`, `today_patient_count`, `active_consultation_count` — all scoped to chef's service
- [x] Create `Backend/app/Modules/ChefService/Controllers/BoxController.php`:
  - Extends BaseResourceController, uses ServiceScopeTrait
  - Overrides `index()` to scope by chef's service_id
  - Overrides `store()` to auto-set service_id from chef's service
  - Overrides `update()` to verify box belongs to chef's service
  - Overrides `destroy()` to check for active assignments before deletion (return 422 if active assignments exist)
  - Uses StoreBoxRequest and UpdateBoxRequest
- [x] Create `Backend/app/Modules/ChefService/Controllers/AssignmentController.php`:
  - Uses ServiceScopeTrait
  - `store(Request $request, int $boxId)`: validates via StoreAssignmentRequest, verifies box and doctor belong to chef's service, creates assignment with `assigned_by` set to auth user
  - `destroy(int $id)`: verifies assignment belongs to chef's service, deletes it
- [x] Create `Backend/app/Modules/ChefService/Controllers/DoctorController.php`:
  - Uses ServiceScopeTrait
  - `index()`: returns doctors in chef's service with assigned box and schedule summary

## Task 5: Backend Routes Registration

Register the Chef de Service API routes.

- [x] Create `Backend/routes/modules/chef.php` with all chef endpoints:
  - Wrapped in `middleware(['auth', 'role:ChefService'])->prefix('chef')` group
  - `GET dashboard` → DashboardController (invokable)
  - `apiResource boxes` → BoxController
  - `POST boxes/{box}/assignments` → AssignmentController@store
  - `DELETE assignments/{assignment}` → AssignmentController@destroy
  - `GET doctors` → DoctorController@index
- [x] Register the new route file in the application's route service provider or bootstrap (same pattern as existing module route files in `routes/modules/`)

## Task 6: Frontend Type Definitions and API Service

Create the Angular service and TypeScript interfaces for the Chef de Service feature.

- [x] Add `'ChefService'` to the `UserRole` type union in `frontend/src/app/core/auth/models/user.model.ts`
- [x] Add `ChefService: '/chef/dashboard'` to the `ROLE_DEFAULT_ROUTES` map in `frontend/src/app/core/auth/models/user.model.ts`
- [x] Create `frontend/src/app/features/chef/chef.service.ts` with:
  - Interfaces: `DashboardKpi`, `Box`, `DoctorShiftAssignment`, `ServiceDoctor`
  - Injectable service with methods: `getDashboard()`, `getBoxes()`, `getBox()`, `createBox()`, `updateBox()`, `deleteBox()`, `createAssignment()`, `deleteAssignment()`, `getDoctors()`
  - All methods use `environment.baseUrl + '/chef'` as base URL

## Task 7: Frontend Route Guard and Routing

Set up the Chef de Service route guard and register routes.

- [x] Create `frontend/src/app/features/chef/chef.guard.ts`:
  - Export `chefServiceGuard` as `CanActivateFn`
  - Allow access if user role is `ChefService` or `Admin`
  - Redirect to `/login` if not authenticated, `/admin/dashboard` if wrong role
- [x] Create `frontend/src/app/features/chef/chef.routes.ts`:
  - Export `CHEF_ROUTES` with lazy-loaded children: dashboard, boxes, boxes/new, boxes/:id/edit, boxes/:id/assign, medecins
  - Apply `chefServiceGuard` at the parent level
  - Default redirect from '' to 'dashboard'
- [x] Register chef routes in `frontend/src/app/app.routes.ts`:
  - Add `{ path: 'chef', loadChildren: () => import('./features/chef/chef.routes').then(m => m.CHEF_ROUTES), canActivate: [authGuard] }` inside the ShellComponent children array

## Task 8: Frontend Dashboard Component

Create the Chef de Service dashboard component.

- [x] Create `frontend/src/app/features/chef/dashboard/chef-dashboard.component.ts`:
  - Standalone component with `ChangeDetectionStrategy.OnPush`
  - Uses signals for reactive state
  - Imports and uses `hm-page-header` and `hm-stat-card` shared components
  - Calls `ChefService.getDashboard()` on init
  - Displays service name in page header
  - Renders 4 KPI stat cards: box count, doctor count, today's patients, active consultations
  - Provides navigation tabs/links to: Boxes, Médecins, Planning, Statistiques

## Task 9: Frontend Box List Component

Create the box list component for the Chef de Service.

- [x] Create `frontend/src/app/features/chef/boxes/box-list.component.ts`:
  - Standalone component with `ChangeDetectionStrategy.OnPush`
  - Uses signals for reactive state
  - Imports `hm-page-header` shared component
  - Calls `ChefService.getBoxes()` on init
  - Displays table/list with columns: label_ar, assigned doctor name, status (Actif/Inactif), actions (Edit/Delete)
  - "Créer une box" button navigating to `/chef/boxes/new`
  - Edit button navigates to `/chef/boxes/:id/edit`
  - Delete button calls `ChefService.deleteBox()` with confirmation dialog
  - Handles 422 error for boxes with active assignments (shows error message)

## Task 10: Frontend Box Form Component

Create the box create/edit form component.

- [x] Create `frontend/src/app/features/chef/boxes/box-form.component.ts`:
  - Standalone component with `ChangeDetectionStrategy.OnPush`
  - Detects create vs edit mode from route params (`:id` presence)
  - Form fields: `label_ar` (text input), `label_fr` (text input), `type` (select: consultation/observation/urgence), `is_active` (toggle/checkbox)
  - Client-side validation: label_ar required, label_fr required, type required
  - On submit: calls `createBox()` or `updateBox()` depending on mode
  - On success: navigates back to `/chef/boxes`
  - In edit mode: pre-fills form with existing box data via `getBox(id)`

## Task 11: Frontend Box Assign Component

Create the doctor-to-box assignment component.

- [x] Create `frontend/src/app/features/chef/boxes/box-assign.component.ts`:
  - Standalone component with `ChangeDetectionStrategy.OnPush`
  - Loads box details and doctor list on init
  - Form fields: doctor dropdown (populated from `getDoctors()`), day-of-week multi-select (Lundi through Dimanche), start_time (time input), end_time (time input)
  - Client-side validation: doctor required, at least one day selected, start_time < end_time
  - On submit: calls `createAssignment(boxId, data)`
  - On success: navigates back to box list or shows success message
  - Displays existing assignments for this box with delete action

## Task 12: Frontend Doctors List Component

Create the read-only doctors list component.

- [x] Create `frontend/src/app/features/chef/medecins/chef-medecins.component.ts`:
  - Standalone component with `ChangeDetectionStrategy.OnPush`
  - Uses signals for reactive state
  - Imports `hm-page-header` shared component
  - Calls `ChefService.getDoctors()` on init
  - Displays read-only table with columns: name, assigned box, schedule summary, active/inactive status
  - No create/edit/delete actions (read-only view)
  - Uses appropriate styling consistent with existing components
