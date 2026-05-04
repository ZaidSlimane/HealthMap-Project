import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PatientStore } from '../../features/bde/data/patient-store';

/* ────────────────────────────────────────────────────────────────────────
 * Admission requests
 *
 * The PENDING admission-request workflow lives entirely client-side until
 * the user clicks "valider l'admission". On validation we POST a real
 * `Admission` to the backend, which:
 *   - validates cross-tenant integrity on patient/service/bed/companion ids
 *   - stamps establishment_id from the auth context
 *   - flips the linked bed.status to 'occupied' via the model observer
 *
 * Frontend-only fields (mode label, garde-malade flag, salle/unite display
 * names) are only used to render the list and to seed the API payload.
 * ──────────────────────────────────────────────────────────────────────── */

export type AdmissionMode = 'Admission normale' | 'Urgence' | 'Programmée';
export type AdmissionStatus = 'PENDING' | 'VALIDATED' | 'ARCHIVED';

/** Backend enum for `admissions.mode`. */
export type ApiAdmissionMode = 'normale' | 'urgence' | 'programmee';
/** Backend enum for `admissions.status`. */
export type ApiAdmissionStatus = 'pending' | 'active' | 'discharged' | 'cancelled';

export interface AdmissionRequest {
  id: string;                       // local id, only meaningful in this service
  // Real backend ids — required to POST a valid admission on validate().
  serviceId: number;
  bedId: number | null;             // null when no bed is allocated yet
  patientId?: number;               // set after we resolve/create the patient
  companionId?: number | null;      // set after we POST a Companion (gardeMalade)
  // Display-only labels (kept until UI consumers stop reading them).
  serviceNom: string;
  uniteId: string;
  uniteNom: string;
  salleId: string;
  salleNom: string;
  litNumero: string;
  // Patient + clinical info captured by the form
  nom: string;
  prenom: string;
  mode: AdmissionMode;
  gardeMalade: boolean;
  motif: string;
  medecin: string;
  decharge: boolean;
  status: AdmissionStatus;
  createdAt: number;
  /** id returned by POST /clinical-core/admissions once validated. */
  apiAdmissionId?: number;
  /** Last error message from a failed validate(), surfaced by the UI. */
  lastError?: string;
}

const MODE_TO_API: Record<AdmissionMode, ApiAdmissionMode> = {
  'Admission normale': 'normale',
  'Urgence': 'urgence',
  'Programmée': 'programmee',
};

@Injectable({ providedIn: 'root' })
export class AdmissionRequestService {
  private http = inject(HttpClient);
  private patientStore = inject(PatientStore);
  private readonly admissionsUrl = `${environment.baseUrl}/clinical-core/admissions`;
  private readonly companionsUrl = `${environment.baseUrl}/clinical-core/companions`;

  private _requests = signal<AdmissionRequest[]>([]);
  readonly all = this._requests.asReadonly();

  readonly pending = computed(() =>
    this._requests().filter(r => r.status === 'PENDING')
  );

  readonly archived = computed(() =>
    this._requests().filter(r => r.status === 'ARCHIVED' || r.status === 'VALIDATED')
  );

  pendingForLit(litId: string | number): AdmissionRequest | null {
    const id = String(litId);
    return this._requests().find(
      r => String(r.bedId ?? '') === id && r.status === 'PENDING'
    ) ?? null;
  }

  /**
   * Queue an admission request locally. No API call until validate().
   *
   * `serviceId` and `bedId` MUST be the real backend numeric ids — the
   * `svc-001-u3-virtual-lit-5` style strings the old mock used will not
   * survive a POST. Pass `bedId = null` if the bed is virtual / not yet
   * allocated and resolve it before validate() is called.
   */
  add(req: Omit<AdmissionRequest, 'id' | 'createdAt' | 'status' | 'decharge' | 'apiAdmissionId' | 'lastError'>): AdmissionRequest {
    const full: AdmissionRequest = {
      ...req,
      id: 'req-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      createdAt: Date.now(),
      status: 'PENDING',
      decharge: false,
    };
    this._requests.update(list => [full, ...list]);
    return full;
  }

  /**
   * Validate a pending request: optionally POSTs a Companion (when
   * gardeMalade=true), then delegates the admission POST to PatientStore
   * so the patient row + dossier + admission stay consistent. The bed's
   * status flip is handled server-side by the Admission observer.
   */
  validate(id: string): Observable<AdmissionRequest | null> {
    const req = this._requests().find(r => r.id === id) ?? null;
    if (!req) return of(null);

    const companion$ = req.gardeMalade && !req.companionId
      ? this.createCompanionFor(req).pipe(map(c => c.id))
      : of(req.companionId ?? null);

    return companion$.pipe(
      // Build the payload expected by PatientStore.recordAdmissionFromRequest,
      // which is the single place that turns a request into a backend row.
      map(companionId => ({ companionId })),
      tap(({ companionId }) => {
        if (companionId !== req.companionId) {
          this.patchLocal(id, { companionId });
        }
      }),
      // POST the admission via PatientStore (it owns the patient lookup/create).
      switchMap(({ companionId }) => this.patientStore.recordAdmissionFromRequest({
        nom: req.nom,
        prenom: req.prenom,
        serviceId: req.serviceId,
        bedId: req.bedId,
        companionId: companionId ?? null,
        mode: MODE_TO_API[req.mode],
        motif: req.motif,
        medecin: req.medecin,
      })),
      tap(({ admissionId, patientId }) => {
        this.patchLocal(id, {
          status: 'VALIDATED',
          apiAdmissionId: admissionId,
          patientId,
          lastError: undefined,
        });
      }),
      map(() => this._requests().find(r => r.id === id) ?? null),
      catchError(err => {
        const msg = err?.error?.message ?? err?.message ?? 'Validation a échoué';
        this.patchLocal(id, { lastError: msg });
        return throwError(() => err);
      }),
    );
  }

  remove(id: string): void {
    this._requests.update(list => list.filter(r => r.id !== id));
  }

  archiveAllValidated(): void {
    this._requests.update(list =>
      list.map(r => r.status === 'VALIDATED' ? { ...r, status: 'ARCHIVED' as AdmissionStatus } : r)
    );
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  private patchLocal(id: string, patch: Partial<AdmissionRequest>): void {
    this._requests.update(list =>
      list.map(r => r.id === id ? { ...r, ...patch } : r)
    );
  }

  private createCompanionFor(req: AdmissionRequest): Observable<{ id: number }> {
    // Minimal companion record. The Companion form / drawer can later
    // capture address, phone, identity_document_id and PATCH them in.
    return this.http.post<{ id: number }>(this.companionsUrl, {
      name: req.nom,
      first_name: req.prenom,
    });
  }
}
