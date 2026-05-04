# Bugs uncovered and fixed

A running list of real (not stylistic) bugs found in the project during agent
sessions, with their root cause and the fix applied.

| # | Bug | Symptom | Root cause | Fix |
|---|-----|---------|-----------|-----|
| 1 | Postgres driver in PHP image | `composer install` failed after switching DB to MySQL | `Dockerfile` still installed `pdo_pgsql` + `postgresql-dev` | Replaced with `pdo_mysql`, dropped `postgresql-dev` |
| 2 | `.env` pointed at Postgres | App couldn't connect to DB | `DB_CONNECTION=pgsql`, `DB_PORT=5432` | Set to `mysql` / `3306` |
| 3 | MySQL container crash-loop | "data directory is unusable / Aborting" | Volume reused from prior Postgres init | `docker compose down -v` to wipe `db_data` |
| 4 | Reserved `MYSQL_USER=root` | MySQL refuses to start | `MYSQL_USER` cannot equal `root` | Removed `MYSQL_USER`/`MYSQL_PASSWORD`, kept `MYSQL_ROOT_PASSWORD` only |
| 5 | Missing `APP_KEY` | Encryption errors on session/cookie | Empty in `.env` | `php artisan key:generate` |
| 6 | FK-before-parent migration crashes | `Failed to open the referenced table 'provinces'` (and `consultations`) | Two migrations shared a timestamp; child sorted before parent alphabetically | Renamed offending migration files to a later timestamp |
| 7 | Missing pivot tables | Login crashed with `role_user` table not found | Pivot table migrations never existed | Added migration creating `role_user`, `permission_role`, `permission_user` |
| 8 | `User::permissions()` broken | Always returned wrong/empty results | Empty closure inside `wherePivot` (TODO comment in code) | Replaced with proper `belongsToMany`; added `allPermissions()` helper |
| 9 | API + session mismatch | `/me` and `logout` errored on `$request->session()` | Routes registered under `api` middleware (stateless) but controller uses sessions | Moved routes to `web` middleware group |
| 10 | CSRF blocked JSON POSTs | After moving to `web`, login POST hit CSRF | Web group includes `VerifyCsrfToken` | Added `validateCsrfTokens(except: ['api/auth/*', 'api/clinical-core/*'])` |
| 11 | `config/auth.php` wrong User class | `/me` failed with "Failed to open stream: No such file" for `App/Models/User.php` | Pointed at non-existent `App\Models\User` (real class is `App\Modules\Auth\Models\User`) | Updated import path |
| 12 | `DatabaseSeeder` broken | `php artisan db:seed` crashed | Imported `App\Models\User` and called `factory()` on it | Rewrote to call `RoleSeeder` only |
| 13 | `RoleSeeder` not idempotent | Re-seeding crashed on duplicate Admin row | `Role::create(...)` | `Role::firstOrCreate(...)` |

## Frontend bugs (in `C:\Users\ZaidS\HealthMap`)

| # | Bug | Fix |
|---|-----|-----|
| F1 | Wrong API base URL (`localhost:8080`) | `http://localhost/api` (matches docker-compose nginx) |
| F2 | No `withCredentials` | Added `credentialsInterceptor` registered in `app.config.ts` |
| F3 | `login()` consumed wrong response shape | Service now `map(res => res.user)` against `{ message, user }` |
| F4 | `User` model didn't match backend (`username`, `password`, `role`) | Updated to `{ id, name, email, roles: UserRoleDetail[] }`; added `getUserRole()` helper on `AuthService` |
| F5 | Demo chips suggested invalid creds | Single chip `Admin/root` matching the backend backdoor |
| F6 | `role.guard` read `user.role` (no longer exists) | Uses `auth.getUserRole()`; backend `Admin` short-circuits to `return true` |
| F7 | Sidebar `filteredItems` read `user.role` | Same: uses `getUserRole()`; `Admin` returns full nav |
| F8 | `profil.component`, `bed-management-page`, `services-config`, `header` referenced removed fields | Migrated to `name` / `email` / `getUserRole()` |
| F9 | BDE dashboard 403'd for Admin | `roleGuard` didn't translate Admin to lowercase `superadmin/bde`; now Admin is a wildcard at top of guard |

## Known intentional placeholders (not bugs)
- Login is hardcoded to `Admin` / `root`. Real auth requires a design decision
  (Sanctum tokens, real password hashes, SSO, …).
- `app/Modules/Geospatial` is an empty placeholder.
