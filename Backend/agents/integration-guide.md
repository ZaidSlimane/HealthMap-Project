# Frontend ↔ Backend integration guide

For the Angular 17 app at `C:\Users\ZaidS\HealthMap`.

## Endpoints

| Method | URL | Body | Response | Notes |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | `{ username, password }` | `{ message, user }` | Sets `laravel-session` cookie. Hardcoded `Admin/root` only. |
| `GET` | `/api/auth/me` | — | `User` (raw, no wrapper) | 401 if no/expired session |
| `POST` | `/api/auth/logout` | — | `{ message }` | Invalidates session |
| `*` | `/api/clinical-core/{resource}` | REST | paginated/object | All require `auth + role:Admin`. 21 resources. |

### `User` shape returned by login/me
```ts
{
  id: number;
  name: string;
  email: string;
  roles: { id: number; role: string }[];   // [{ role: 'Admin' }] today
}
```
Login response wraps this: `{ message: string, user: User }`. `/me` does **not** wrap.

## CORS / cookies
- Backend allows `http://localhost:4200` with credentials.
- Cookie is `SameSite=Lax`. Same-site between `localhost:4200` and `localhost:80` is fine.
- For prod cross-domain HTTPS: set `SESSION_SAME_SITE=none` and `SESSION_SECURE_COOKIE=true` in `.env`.

## Required frontend setup
```ts
// app.config.ts
provideHttpClient(withInterceptors([credentialsInterceptor]))

// credentialsInterceptor: clones req with { withCredentials: true }
```

## Resource list (under `/api/clinical-core/`)
admissions, beds, bornes, companions, consultations, consultation-symptoms,
countries, establishment-types, establishment-units, identity-documents,
marital-statuses, medical-documents, municipalities, observations, patients,
prescriptions, prescription-medications, provinces, services, service-types,
waiting-lists.

Each supports `index` (paginated, `?per_page=N`), `show`, `store`, `update`,
`destroy` — standard `apiResource` verbs.

## Error contract

| Status | Meaning | UI action |
|---|---|---|
| `200`/`201`/`204` | OK | proceed |
| `401` | Not authenticated | redirect to `/login` |
| `403` | Authenticated, wrong role | show forbidden |
| `419` | Session/CSRF expired | force re-login |
| `422` | Validation: `{ message, errors: { field: [...] } }` | render field errors |
| `500` | Server error | toast |

`AuthController::login` returns `422` with both `message` and `errors.username`.

## Things deliberately NOT done yet
- Per-field validation rules on ClinicalCore controllers (only `$fillable` filtering).
- Sanctum / token auth.
- Real password authentication for non-admin users.
- File upload endpoints for `MedicalDocument`.
