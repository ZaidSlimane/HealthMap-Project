# Architecture notes

Quick reference for AI agents (and humans) working in this codebase.

## Stack
- **Framework**: Laravel 13 (PHP ^8.3)
- **DB**: MySQL 8.0 (via Docker)
- **Web**: Nginx + PHP-FPM (Alpine)
- **Frontend**: Angular 17 (separate repo at `C:\Users\ZaidS\HealthMap`)

## Modular monolith layout

Instead of vanilla Laravel folders, this project uses **modules per domain**:

```
app/Modules/
├── Auth/
│   ├── Controllers/    # AuthController
│   ├── Middleware/     # RoleMiddleware (registered as alias 'role')
│   └── Models/         # User, Role, Permission
├── ClinicalCore/
│   ├── Controllers/    # BaseResourceController + 20 thin resource controllers
│   └── Models/         # 21 domain models (Patient, Admission, ...)
└── Geospatial/         # placeholder
```

`app/Models/` is **empty** — do not look for models there. `App\Models\User`
does **not** exist; the real class is `App\Modules\Auth\Models\User` and
`config/auth.php` already points at it.

## Routing

Routes live in `routes/modules/*.php` and are wired up in `bootstrap/app.php`:

| Prefix | File | Middleware | Notes |
|---|---|---|---|
| `api/auth` | `routes/modules/auth.php` | `web` | Session-based; CSRF disabled here |
| `api/clinical-core` | `routes/modules/clinical_core.php` | `web` | All inside `auth + role:Admin` group; CSRF disabled here |

The `web` group is used (not `api`) because auth is session-cookie based.

## Auth model

- **Stateful**: `Auth::login()` sets the `laravel-session` cookie.
- **Frontend** must use `withCredentials: true` on every request.
- **CORS**: `config/cors.php` whitelists `http://localhost:4200` with credentials.
- **Hardcoded** login: `Admin` / `root` only (see `AuthController::login`).
  Auto-creates the admin user on first call and assigns the `Admin` role.

### Role gating
- Backend: `->middleware('role:Admin')` via `RoleMiddleware`.
- Frontend: `roleGuard([...])` short-circuits to `true` when user role is
  `'Admin'`. Sidebar filtering does the same.

## Database conventions
- Migration files use timestamp prefix `YYYY_MM_DD_HHmmss_*`.
- Be careful: when two migrations share a timestamp, alphabetical order
  decides — child tables must be alphabetically *after* their parents, or
  rename the timestamps. (See `agents/bugs-fixed.md` #6.)
- Pivot tables follow Laravel convention: alphabetically ordered singular
  names joined by underscore (e.g., `role_user`, `permission_role`).

## Seeding
- Only `RoleSeeder` runs by default. It creates the `Admin` role idempotently.
- Run with: `docker compose exec app php artisan db:seed --force`.

## Useful commands inside the docker stack
```bash
# Boot everything
docker compose up -d --build

# Wait for DB ready
docker compose exec db mysqladmin ping -uroot -proot --silent

# Migrate fresh
docker compose exec app php artisan migrate:fresh --force

# Seed
docker compose exec app php artisan db:seed --force

# Tail Laravel logs
docker compose exec app tail -f storage/logs/laravel.log
```
