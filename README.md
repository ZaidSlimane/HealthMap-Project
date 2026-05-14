# HealthMap Project - Development Guidelines

## Frontend Architecture Patterns

### 1. Reactive Data Handling (The Observable Rule)
To ensure type safety and prevent runtime crashes, all data fetched from services must be handled as **Observables**.

**Rule:** Never access properties of a service return value directly.

#### ❌ Incorrect (Causes Build/Runtime Errors)
```typescript
// component.ts
this.patient = this.patientService.getPatient(id); 
// Error: 'patient' is an Observable, not a Patient object.
```

#### ✅ Correct Approach A: Async Pipe (Preferred)
Use the `async` pipe in templates for the cleanest memory management.
```typescript
// component.ts
patient$ = this.patientService.getPatient(id);
```
```html
<!-- component.html -->
<div *ngIf="patient$ | async as patient">
  {{ patient.fullName }}
</div>
```

#### ✅ Correct Approach B: Manual Subscription (For Logic)
Use this when you need the data for TypeScript calculations. Always use `takeUntil` or `firstValueFrom` to prevent memory leaks.
```typescript
async ngOnInit() {
  const patient = await firstValueFrom(this.patientService.getPatient(id));
  this.patientName = patient?.fullName;
}
```

## Docker Deployment
- The project uses a multi-stage Docker build.
- The `frontend` build is a gate; if `npm run build` fails, the container will not be created.
- Use `.env` for environment variables (do not commit to Git).
