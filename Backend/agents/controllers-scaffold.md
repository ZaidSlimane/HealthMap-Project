# ClinicalCore controllers — scaffold notes

## Pattern

A single abstract `BaseResourceController` does all the CRUD work. Concrete
controllers are 1-line subclasses that just declare the model:

```php
class PatientController extends BaseResourceController
{
    protected string $modelClass = Patient::class;
    protected array $with = ['nationality', 'maritalStatus']; // optional
}
```

`BaseResourceController` provides:
- `index()`   → paginated list (`?per_page=N`, default 25)
- `show($id)` → single record with eager-loaded `$with`
- `store()`   → create using `$model->getFillable()` to filter input → 201
- `update()`  → fill + save → 200
- `destroy()` → delete → 204

## Why not Laravel resource generators?
- Each model already has correct `$fillable` and relations — the boilerplate
  Artisan would generate would just be deleted again.
- Centralizing in a base controller means one place to add concerns later
  (logging, soft-deletes, query filters, policies, etc.).

## Eager-loading
Set `$with = [...]` on a controller to eager-load relations on index/show:

| Controller | `$with` |
|---|---|
| `AdmissionController` | `patient`, `service` |
| `ConsultationController` | `patient`, `doctor`, `admission`, `symptoms` |
| `PatientController` | `nationality`, `maritalStatus` |

The other 18 controllers leave `$with` empty.

## What's still missing
- **No FormRequest classes** — invalid payloads produce DB errors (500) rather
  than tidy 422 responses. Adding a `protected array $rules = [...]` on each
  subclass and calling `$request->validate($this->rules)` in `store/update`
  would be a small, low-risk improvement.
- **No filtering, sorting, search** on `index()`.
- **No authorization beyond `role:Admin`** — when more roles arrive, swap the
  blanket middleware for per-controller policies.
- **No API resources / transformers** — responses leak raw DB columns. Fine
  for an internal admin UI today; revisit for public APIs.

## Route registration
All 21 resources are wired in `routes/modules/clinical_core.php`:

```php
Route::middleware(['auth', 'role:Admin'])->group(function () {
    Route::apiResource('admissions', AdmissionController::class);
    // ... 20 more
});
```
