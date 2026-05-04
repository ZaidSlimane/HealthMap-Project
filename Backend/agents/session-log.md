# Session log

Chronological log of changes applied to the repo during agent sessions.

## Session 1 — 2026-04-26

### Project bring-up
1. **Switched DB to MySQL** in `docker-compose.yml`
   - Image: `postgres:16-alpine` → `mysql:8.0`
   - Env: `POSTGRES_*` → `MYSQL_*` (using `MYSQL_ROOT_PASSWORD` only — `MYSQL_USER=root` is reserved)
   - Port: `5432` → `3306`
   - Volume mount: `/var/lib/postgresql/data` → `/var/lib/mysql`
2. **Updated Dockerfile** — `pdo_pgsql` + `postgresql-dev` → `pdo_mysql`.
3. **Updated `.env`** — `DB_CONNECTION=mysql`, `DB_PORT=3306`.
4. **Generated `APP_KEY`** in container (`php artisan key:generate`).
5. **Wiped stale volume** (`docker compose down -v`) — leftover Postgres init was crashing MySQL.

### New module placeholder
- Created empty `app/Modules/Geospatial/` folder with `.gitkeep`.

### Auth made functional
- Moved `api/auth/*` from `api` → `web` middleware group (sessions are required).
- Added CSRF exception for `api/auth/*` and `api/clinical-core/*`.
- Updated `config/auth.php` to point at `App\Modules\Auth\Models\User` (was the
  non-existent `App\Models\User`).
- Replaced broken `User::permissions()` with a real `belongsToMany` and added
  `allPermissions()` helper that unions direct + role-inherited permissions.

### Database hygiene
- Renamed migration timestamps to fix FK-before-parent ordering crashes:
  - `093937_create_municipalities` → `093938`
  - `094552_create_consultation_symptoms` → `094553`
  - `094553_create_prescription_medications` → `094554`
  - `094554_create_medical_documents` / `_observations` → `094555`
- Added migration creating the missing `role_user`, `permission_role`,
  `permission_user` pivot tables.
- Made `RoleSeeder` idempotent (`firstOrCreate`) and wired it into
  `DatabaseSeeder` (which previously referenced a non-existent User model).

### ClinicalCore scaffolding
- Added `BaseResourceController` with generic `index/show/store/update/destroy`.
- Generated 20 thin concrete controllers, one per ClinicalCore model.
- Wrote `routes/modules/clinical_core.php` registering 21 `apiResource`
  groups, all gated by `auth + role:Admin` middleware.
- Updated `bootstrap/app.php` to put clinical-core under `web` middleware.

### CORS
- Created `config/cors.php`:
  - `paths: ['api/*']`
  - `allowed_origins: ['http://localhost:4200']`
  - `supports_credentials: true`

### .gitignore polish
- Added agent/IDE-local dirs, debug logs, coverage, composer.phar, local
  SQLite, dumps/archives, and generated docs.
- Added `/agents` (this folder).
