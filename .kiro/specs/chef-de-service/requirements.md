# Requirements Document

## Introduction

The Chef de Service feature introduces a new actor role (`ChefService`) that sits between the Super Admin and the Doctor in the organizational hierarchy. A Chef de Service manages exactly one service: they create and configure consultation boxes, assign doctors to boxes with shift schedules, and monitor service-level KPIs through a dedicated dashboard. They cannot access other services, the admin panel, or clinical screens.

## Glossary

- **Chef_de_Service**: A user with the `ChefService` role, responsible for managing a single service's boxes and doctor assignments.
- **Service**: An organizational unit within an establishment (e.g., CARDIOLOGIE, URGENCES) that contains boxes and doctors.
- **Box**: A consultation room or station within a service where doctors see patients. Stored in the `bornes` table with extended fields.
- **Doctor_Shift_Assignment**: A record linking a doctor to a specific box within a service, including the days of the week and time range for that assignment.
- **Service_User_Pivot**: The existing `service_user` pivot table linking users to services, extended with an `is_chef` flag.
- **Dashboard**: The Chef de Service's landing page showing KPI cards and navigation to management screens.
- **KPI_Card**: A visual indicator on the dashboard displaying a single metric (e.g., box count, doctor count).
- **ChefServiceGuard**: A frontend route guard that verifies the user holds the `ChefService` role and is accessing their own service.

## Requirements

### Requirement 1: ChefService Role Creation

**User Story:** As a Super Admin, I want to designate a user as Chef de Service for a specific service, so that they can manage that service autonomously.

#### Acceptance Criteria

1. THE System SHALL include a `ChefService` role in the roles table alongside existing roles (Admin, Doctor, BDE, Pharmacy, Reception).
2. WHEN a user is marked as `is_chef = true` in the `service_user` pivot for a given service, THE System SHALL grant that user the `ChefService` role scoped to that service.
3. THE System SHALL allow at most one user to hold `is_chef = true` per service in the `service_user` pivot table.
4. WHEN a user holds the `ChefService` role, THE System SHALL restrict that user's access to only the service for which `is_chef = true`.

### Requirement 2: Chef de Service Dashboard

**User Story:** As a Chef de Service, I want to see a dashboard with my service's key metrics, so that I can monitor activity at a glance.

#### Acceptance Criteria

1. WHEN the Chef_de_Service navigates to `/chef/dashboard`, THE Dashboard SHALL display the service name prominently.
2. WHEN the Chef_de_Service views the dashboard, THE Dashboard SHALL display KPI_Cards for: total box count, total doctor count, today's patient count, and active consultation count.
3. THE Dashboard SHALL provide navigation tabs to the following sections: Boxes, Médecins, Planning, Statistiques.
4. THE Dashboard SHALL retrieve KPI data scoped exclusively to the Chef_de_Service's own service.
5. IF the Chef_de_Service attempts to access a dashboard for a different service, THEN THE System SHALL return a 403 Forbidden response.

### Requirement 3: Box Management — List and Display

**User Story:** As a Chef de Service, I want to see all boxes in my service, so that I can manage their configuration.

#### Acceptance Criteria

1. WHEN the Chef_de_Service navigates to `/chef/boxes`, THE System SHALL display a list of boxes belonging to the Chef_de_Service's service only.
2. THE System SHALL display for each box: the Arabic label (`label_ar`), the assigned doctor name, the status (Actif or Inactif), and Edit/Delete action buttons.
3. THE System SHALL display a "Créer une box" button that navigates to the box creation form.
4. IF the Chef_de_Service attempts to view boxes from another service, THEN THE System SHALL return a 403 Forbidden response.

### Requirement 4: Box Management — Create and Edit

**User Story:** As a Chef de Service, I want to create and edit boxes in my service, so that I can configure consultation stations.

#### Acceptance Criteria

1. WHEN the Chef_de_Service submits the box creation form, THE System SHALL create a new box with the following fields: `label_ar` (Arabic name), `label_fr` (French name), `type` (one of: consultation, observation, urgence), and `is_active` (boolean toggle).
2. THE System SHALL validate that `label_ar` is a non-empty string.
3. THE System SHALL validate that `label_fr` is a non-empty string.
4. THE System SHALL validate that `type` is one of the allowed values: consultation, observation, or urgence.
5. WHEN the Chef_de_Service edits an existing box, THE System SHALL update only the fields provided and retain existing values for omitted fields.
6. THE System SHALL automatically associate the created box with the Chef_de_Service's service.
7. IF the Chef_de_Service attempts to create or edit a box in another service, THEN THE System SHALL return a 403 Forbidden response.

### Requirement 5: Box Management — Delete

**User Story:** As a Chef de Service, I want to delete boxes from my service, so that I can remove unused consultation stations.

#### Acceptance Criteria

1. WHEN the Chef_de_Service requests deletion of a box, THE System SHALL remove the box record from the database.
2. IF the box has active doctor shift assignments, THEN THE System SHALL prevent deletion and return a validation error indicating the box has active assignments.
3. IF the Chef_de_Service attempts to delete a box belonging to another service, THEN THE System SHALL return a 403 Forbidden response.

### Requirement 6: Doctor-to-Box Assignment

**User Story:** As a Chef de Service, I want to assign doctors to boxes with specific schedules, so that I can organize the service's daily operations.

#### Acceptance Criteria

1. WHEN the Chef_de_Service navigates to `/chef/boxes/{id}/assign`, THE System SHALL display a form with: a dropdown of doctors belonging to the Chef_de_Service's service, day-of-week selection (Lundi through Dimanche), and start/end time fields.
2. THE System SHALL populate the doctor dropdown exclusively with doctors linked to the Chef_de_Service's service via the `service_user` pivot.
3. WHEN the Chef_de_Service submits the assignment form, THE System SHALL create a `doctor_shift_assignment` record with: `user_id`, `service_id`, `borne_id`, `day_of_week` (JSON array of selected days), `start_time`, `end_time`, and `assigned_by` (the Chef_de_Service's user ID).
4. THE System SHALL validate that `start_time` is earlier than `end_time`.
5. THE System SHALL validate that at least one day of the week is selected.
6. IF the selected doctor does not belong to the Chef_de_Service's service, THEN THE System SHALL reject the assignment with a 403 Forbidden response.
7. IF the Chef_de_Service attempts to assign a doctor to a box in another service, THEN THE System SHALL return a 403 Forbidden response.

### Requirement 7: Doctors List — Read-Only View

**User Story:** As a Chef de Service, I want to see the list of doctors in my service, so that I can review their assignments and availability.

#### Acceptance Criteria

1. WHEN the Chef_de_Service navigates to `/chef/medecins`, THE System SHALL display a read-only list of doctors belonging to the Chef_de_Service's service.
2. THE System SHALL display for each doctor: name, assigned box (if any), schedule summary, and active/inactive status.
3. THE System SHALL NOT provide create, edit, or delete actions for doctors on this screen.
4. THE System SHALL scope the doctor list exclusively to the Chef_de_Service's own service.

### Requirement 8: Permission Boundaries and Access Control

**User Story:** As a system administrator, I want strict permission boundaries for the Chef de Service role, so that service chiefs cannot access resources outside their scope.

#### Acceptance Criteria

1. THE ChefServiceGuard SHALL verify that the authenticated user holds the `ChefService` role before granting access to any `/chef/*` route.
2. THE ChefServiceGuard SHALL verify that the service referenced in the route belongs to the authenticated Chef_de_Service.
3. THE System SHALL NOT allow a Chef_de_Service to create services.
4. THE System SHALL NOT allow a Chef_de_Service to access the admin panel routes (`/admin/*`).
5. THE System SHALL NOT allow a Chef_de_Service to access clinical consultation screens.
6. THE System SHALL NOT allow a Chef_de_Service to create or delete doctor user accounts.
7. WHEN the RoleMiddleware receives a request for a Chef-scoped endpoint, THE RoleMiddleware SHALL check for the `ChefService` role in the user's roles collection.

### Requirement 9: Database Schema Extensions

**User Story:** As a developer, I want the database schema extended to support the Chef de Service feature, so that all data relationships are properly modeled.

#### Acceptance Criteria

1. THE System SHALL add an `is_chef` boolean column (default `false`) to the `service_user` pivot table.
2. THE System SHALL add a `label_fr` string column to the `bornes` table.
3. THE System SHALL add a `type` enum column (values: consultation, observation, urgence) to the `bornes` table.
4. THE System SHALL add an `is_active` boolean column (default `true`) to the `bornes` table.
5. THE System SHALL add a `service_id` foreign key column to the `bornes` table referencing the `services` table.
6. THE System SHALL create a `doctor_shift_assignments` table with columns: `id`, `user_id` (FK to users), `service_id` (FK to services), `borne_id` (FK to bornes), `day_of_week` (JSON), `start_time` (time), `end_time` (time), `assigned_by` (FK to users), `is_active` (boolean, default true), `created_at`, `updated_at`.

### Requirement 10: Frontend Module Structure and Routing

**User Story:** As a developer, I want a dedicated Angular module for the Chef de Service, so that the feature is isolated and maintainable.

#### Acceptance Criteria

1. THE System SHALL create a `chef/` module directory containing: `chef-routing.module.ts`, `dashboard/chef-dashboard.component.ts`, `boxes/box-list.component.ts`, `boxes/box-form.component.ts`, `boxes/box-assign.component.ts`, and `medecins/chef-medecins.component.ts`.
2. THE System SHALL implement all components as Angular 17 standalone components using signals.
3. THE System SHALL register the `ChefServiceGuard` as a route guard on all `/chef/*` routes.
4. THE System SHALL reuse existing shared UI components: `page-header`, `stat-card`, and `breadcrumb`.
5. WHEN the Chef_de_Service logs in, THE System SHALL redirect to `/chef/dashboard` as the default landing route.

### Requirement 11: Backend API Endpoints

**User Story:** As a frontend developer, I want dedicated API endpoints for the Chef de Service, so that the dashboard and management screens can retrieve and mutate data.

#### Acceptance Criteria

1. THE System SHALL expose a `GET /api/chef/dashboard` endpoint returning KPI data (box count, doctor count, today's patients, active consultations) scoped to the authenticated Chef_de_Service's service.
2. THE System SHALL expose CRUD endpoints for boxes under `GET|POST /api/chef/boxes` and `GET|PUT|DELETE /api/chef/boxes/{id}`, scoped to the Chef_de_Service's service.
3. THE System SHALL expose a `GET /api/chef/doctors` endpoint returning the list of doctors in the Chef_de_Service's service.
4. THE System SHALL expose `POST /api/chef/boxes/{id}/assignments` and `DELETE /api/chef/assignments/{id}` endpoints for managing doctor shift assignments.
5. THE System SHALL protect all `/api/chef/*` endpoints with the `role:ChefService` middleware.
6. THE System SHALL enforce service-level scoping on all Chef API endpoints by verifying the authenticated user's `is_chef` pivot flag matches the target service.
