import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { OnboardingProfile, OnboardingStep } from '../auth/models/onboarding.model';
import {
  CreateEstablishmentDto,
  Establishment,
  EstablishmentType,
  Wilaya,
} from '../models/establishment.model';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Drives the 4-step onboarding wizard. All reference data (wilayas,
 * establishment types, establishments directory) is fetched from the
 * backend — there are no more hardcoded TypeScript directories.
 */
@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly STORAGE_KEY = 'healthmap_onboarding';
  private readonly ONBOARDING_URL = `${environment.baseUrl}/onboarding`;
  private readonly AUTH_URL = `${environment.baseUrl}/auth`;

  // ── Wizard state ────────────────────────────────────────────────────────
  readonly profile = signal<OnboardingProfile>(this.loadProfile());
  readonly currentStep = signal<OnboardingStep>('type');
  readonly skipped = signal<boolean>(this.loadSkipped());

  // ── Reference data (lazy-loaded from API) ───────────────────────────────
  readonly wilayas = signal<Wilaya[]>([]);
  readonly establishmentTypes = signal<EstablishmentType[]>([]);
  readonly establishments = signal<Establishment[]>([]);
  readonly loadingEstablishments = signal<boolean>(false);

  /**
   * Establishments matching the user's chosen wilaya + type. Server already
   * filters via query params, so this just exposes the latest fetch.
   */
  readonly filteredEstablishments = computed(() => this.establishments());

  /**
   * The wizard exists ONLY for the bootstrap super-admin (Admin/root) — a
   * user with NO establishment yet. Once a user has an establishment they
   * are an established member of that tenant (whether they're the admin
   * created during onboarding or a staff account created later by that
   * admin) and must NEVER see the wizard.
   *
   * We also keep a localStorage fallback for the brief window before
   * /me resolves on a cold start, so the page doesn't flicker.
   */
  readonly needsOnboarding = computed(() => {
    if (this.skipped()) return false;
    const user = this.auth.currentUser();
    if (user) {
      const isAdmin = user.roles?.some(r => r.role === 'Admin' || r.role === 'superadmin');
      if (!isAdmin) return false;
      return !user.establishment;
    }
    return localStorage.getItem('healthmap_onboarding_done') !== 'true';
  });

  /**
   * Whenever the active user changes (login, logout, /me refresh), reset
   * the in-memory wizard signals so we never carry over a previous user's
   * "skipped" or partial-profile state. AuthService also clears the
   * matching localStorage keys on login/logout.
   */
  private readonly _resetOnUserChange = effect(() => {
    const user = this.auth.currentUser();
    // Reset wizard state for the bootstrap user (no establishment) so a
    // fresh onboarding always starts clean. Tenant-scoped users never
    // need the wizard so their state is irrelevant.
    if (!user || !user.establishment) {
      this.skipped.set(false);
      this.profile.set({
        establishmentType: null,
        wilayaCode: null,
        establishmentId: null,
        passwordChanged: false,
      });
      this.currentStep.set('type');
    }
  }, { allowSignalWrites: true });

  // ── Profile persistence ─────────────────────────────────────────────────
  private loadProfile(): OnboardingProfile {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return {
      establishmentType: null,
      wilayaCode: null,
      establishmentId: null,
      passwordChanged: false,
    };
  }

  private loadSkipped(): boolean {
    return localStorage.getItem('healthmap_onboarding_skipped') === 'true';
  }

  private persistProfile(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.profile()));
  }

  // ── Reference data fetchers ─────────────────────────────────────────────
  loadWilayas(): Observable<Wilaya[]> {
    return this.http.get<Wilaya[]>(`${this.ONBOARDING_URL}/wilayas`).pipe(
      tap(list => this.wilayas.set(list)),
    );
  }

  loadEstablishmentTypes(): Observable<EstablishmentType[]> {
    return this.http.get<EstablishmentType[]>(`${this.ONBOARDING_URL}/establishment-types`).pipe(
      tap(list => this.establishmentTypes.set(list)),
    );
  }

  /**
   * Fetch the establishments directory filtered by the current wilaya/type
   * picks. Called whenever the user lands on (or returns to) step 3.
   */
  loadEstablishments(): Observable<Establishment[]> {
    const p = this.profile();
    let params = new HttpParams();
    if (p.wilayaCode != null) params = params.set('wilaya_code', p.wilayaCode);
    if (p.establishmentType) params = params.set('type', p.establishmentType);

    this.loadingEstablishments.set(true);
    return this.http.get<Establishment[]>(`${this.ONBOARDING_URL}/establishments`, { params }).pipe(
      tap({
        next: list => {
          this.establishments.set(list);
          this.loadingEstablishments.set(false);
        },
        error: () => this.loadingEstablishments.set(false),
      }),
    );
  }

  /**
   * Create a custom establishment when the user's hospital isn't in the
   * seeded directory. Returns the new row and auto-selects it as the
   * wizard's pick.
   */
  createCustomEstablishment(payload: CreateEstablishmentDto): Observable<Establishment> {
    return this.http.post<Establishment>(`${this.ONBOARDING_URL}/establishments`, payload).pipe(
      tap(est => {
        // Surface the new row in the list and pick it.
        this.establishments.update(list => [est, ...list.filter(e => e.id !== est.id)]);
        this.setEstablishment(est.slug);
      }),
    );
  }

  // ── Setters used by the wizard component ────────────────────────────────
  setEstablishmentType(code: string): void {
    this.profile.update(p => ({ ...p, establishmentType: code, establishmentId: null }));
    this.persistProfile();
  }

  setWilaya(code: number): void {
    this.profile.update(p => ({ ...p, wilayaCode: code, establishmentId: null }));
    this.persistProfile();
  }

  setEstablishment(slug: string): void {
    this.profile.update(p => ({ ...p, establishmentId: slug }));
    this.persistProfile();
  }

  // ── API actions ─────────────────────────────────────────────────────────
  changePassword(currentPassword: string, newPassword: string): Observable<unknown> {
    return this.http.post(`${this.AUTH_URL}/change-password`, {
      current_password: currentPassword,
      new_password: newPassword,
    }).pipe(
      tap(() => {
        this.profile.update(p => ({ ...p, passwordChanged: true }));
        this.persistProfile();
        // Refresh the cached user so must_change_password flips client-side.
        this.auth.checkAuth().subscribe({ error: () => {} });
      }),
    );
  }

  /**
   * Atomic onboarding finalizer.
   *
   * Sends the wizard picks + the new admin password in a single call.
   * The backend creates a brand-new establishment admin user with that
   * password, links it to the chosen establishment, resets the shared
   * bootstrap account back to its hardcoded password (so the next
   * establishment can onboard), and switches the session to the new
   * admin. Subsequent /me calls will return the new user.
   */
  completeOnboarding(newPassword: string): Observable<unknown> {
    const p = this.profile();
    return this.http.post(`${this.ONBOARDING_URL}/complete`, {
      establishment_type: p.establishmentType,
      wilaya_code: p.wilayaCode,
      establishment_id: p.establishmentId,
      new_password: newPassword,
    }).pipe(
      tap(() => {
        localStorage.setItem('healthmap_onboarding_done', 'true');
        // Refresh the cached user — identity has changed (we're now the
        // establishment admin, not the bootstrap user).
        this.auth.checkAuth().subscribe({ error: () => {} });
      }),
    );
  }

  skipOnboarding(): void {
    this.skipped.set(true);
    localStorage.setItem('healthmap_onboarding_skipped', 'true');
  }

  goToStep(step: OnboardingStep): void {
    this.currentStep.set(step);
  }

  resetOnboarding(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('healthmap_onboarding_done');
    localStorage.removeItem('healthmap_onboarding_skipped');
    this.profile.set({
      establishmentType: null,
      wilayaCode: null,
      establishmentId: null,
      passwordChanged: false,
    });
    this.skipped.set(false);
    this.currentStep.set('type');
  }
}
