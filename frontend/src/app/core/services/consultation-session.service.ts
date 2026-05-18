import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface ConsultationSession {
  queueId: number;
  patientId: number;
  serviceId: number;
  boxId: number;
  consultationId: number | null;
  patient: SessionPatient | null;
}

export interface SessionPatient {
  id: number;
  name: string;
  first_name: string;
  name_ar?: string;
  first_name_ar?: string;
  gender?: string;
  date_of_birth?: string;
  nin?: string;
  patient_matricule?: string;
}

const STORAGE_KEY = 'healthmap_consultation_session';

@Injectable({ providedIn: 'root' })
export class ConsultationSessionService {
  private readonly http = inject(HttpClient);
  private readonly API = environment.baseUrl;

  private readonly _session = signal<ConsultationSession | null>(this.loadFromStorage());

  /** Current active session (null if no consultation in progress) */
  readonly session = this._session.asReadonly();

  /** Quick accessors */
  readonly patient = computed(() => this._session()?.patient ?? null);
  readonly consultationId = computed(() => this._session()?.consultationId ?? null);
  readonly queueId = computed(() => this._session()?.queueId ?? null);
  readonly isActive = computed(() => this._session() !== null);

  /**
   * Start a new consultation session. Called from the queue screen
   * after the /start API returns a consultation ID.
   */
  start(params: {
    queueId: number;
    patientId: number;
    serviceId: number;
    boxId: number;
    consultationId: number | null;
  }): void {
    const session: ConsultationSession = {
      ...params,
      patient: null,
    };
    this._session.set(session);
    this.persist();
    this.loadPatient(params.patientId);
  }

  /**
   * Resume an existing session from query params (e.g. page refresh).
   * Only creates a session if one doesn't already exist.
   */
  resumeFromParams(params: {
    queueId?: number | null;
    patientId?: number | null;
    serviceId?: number | null;
    boxId?: number | null;
    consultationId?: number | null;
  }): void {
    // If we already have a session with the same queue ID, keep it
    const current = this._session();
    if (current && current.queueId === params.queueId) return;

    if (params.queueId && params.patientId && params.serviceId && params.boxId) {
      this.start({
        queueId: params.queueId,
        patientId: params.patientId,
        serviceId: params.serviceId,
        boxId: params.boxId,
        consultationId: params.consultationId ?? null,
      });
    }
  }

  /**
   * Update the consultation ID (e.g. after /start returns it).
   */
  setConsultationId(id: number): void {
    const current = this._session();
    if (current) {
      this._session.set({ ...current, consultationId: id });
      this.persist();
    }
  }

  /**
   * Clear the session (consultation completed or cancelled).
   */
  clear(): void {
    this._session.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Load patient details from the API and cache in session.
   */
  private loadPatient(patientId: number): void {
    this.http.get<SessionPatient>(`${this.API}/clinical-core/patients/${patientId}`).subscribe({
      next: (patient) => {
        const current = this._session();
        if (current) {
          this._session.set({ ...current, patient });
          this.persist();
        }
      }
    });
  }

  private persist(): void {
    const session = this._session();
    if (session) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }

  private loadFromStorage(): ConsultationSession | null {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
