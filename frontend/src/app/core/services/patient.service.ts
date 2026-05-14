import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';

/* ────────────────────────────────────────────────────────────────────────
 * Backend-aligned DTOs
 *
 * Mirrors `app/Modules/ClinicalCore/Models/Patient.php`:
 *   - tenant-scoped (server stamps establishment_id)
 *   - patient_matricule auto-generated server-side when omitted
 *   - nin / ins / marital_status_id are required at the DB level
 * ──────────────────────────────────────────────────────────────────────── */

export type Gender = 'M' | 'F';

export interface ApiPatient {
  id: number;
  patient_matricule: string | null;
  nin: string;
  ins: string;
  name: string | null;
  first_name: string | null;
  name_ar: string | null;
  first_name_ar: string | null;
  gender: Gender | null;
  date_of_birth: string | null;
  birth_place_id: number | null;
  father_first_name: string | null;
  mother_name: string | null;
  mother_first_name: string | null;
  father_first_name_ar: string | null;
  mother_name_ar: string | null;
  mother_first_name_ar: string | null;
  nationality_id: number | null;
  marital_status_id: number;
  spouse_id: number | null;
  establishment_id: number;
  // Eager-loaded relations (the controller pulls them on index/show)
  nationality?: { id: number; name?: string } | null;
  marital_status?: { id: number; label?: string } | null;
  birth_place?: { id: number; name?: string } | null;
}

export interface ApiPatientCreate {
  nin: string;
  ins: string;
  marital_status_id: number;
  patient_matricule?: string | null;
  name?: string | null;
  first_name?: string | null;
  name_ar?: string | null;
  first_name_ar?: string | null;
  gender?: Gender | null;
  date_of_birth?: string | null;
  birth_place_id?: number | null;
  father_first_name?: string | null;
  mother_name?: string | null;
  mother_first_name?: string | null;
  father_first_name_ar?: string | null;
  mother_name_ar?: string | null;
  mother_first_name_ar?: string | null;
  nationality_id?: number | null;
  spouse_id?: number | null;
}

export type ApiPatientUpdate = Partial<ApiPatientCreate>;

/** Standard Laravel paginator envelope. */
export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/* ────────────────────────────────────────────────────────────────────────
 * Legacy mock interfaces
 *
 * Kept so the ~30 components still consuming the old PatientService keep
 * compiling. They now talk to thin shims that return empty data — every
 * call site needs to be migrated to the typed API methods below.
 * ──────────────────────────────────────────────────────────────────────── */

/** @deprecated Use `ApiPatient`. Kept as a type alias for the legacy callers. */
export interface Patient {
  id: number;
  fullName: string;
  dob: string;
  admissionNumber: number;
  service: string;
  medecin: string;
  dateAdmission: string;
  statut: 'urgence' | 'normal';
  queueNumber: number;
}

/** @deprecated radiology / labo were never on the real API; now wired in their own services. */
export interface RadioRequest {
  id: number; patientName: string; examType: string; medecin: string;
  service: string; dateRequest: string; rndv: string; statut: 'urgence' | 'normal';
}
/** @deprecated */
export interface LabRequest {
  id: number; admissionNumber: number; patientName: string;
  service: string; medecin: string; dateRequest: string; statut: 'urgence' | 'normal';
}

/* ──────────────────────────────────────────────────────────────────────── */

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/clinical-core/patients`;

  // ── Real API ────────────────────────────────────────────────────────

  list(perPage = 25, page = 1): Observable<Paginated<ApiPatient>> {
    const params = new HttpParams()
      .set('per_page', perPage)
      .set('page', page);
    return this.http.get<Paginated<ApiPatient>>(this.base, { params });
  }

  /** Search by patient_matricule, NIN, or name (client-side filter on a page). */
  search(query: string, perPage = 50): Observable<ApiPatient[]> {
    const q = query.trim().toLowerCase();
    return this.list(perPage, 1).pipe(
      map(p => !q ? p.data : p.data.filter(x =>
        (x.patient_matricule ?? '').toLowerCase().includes(q) ||
        (x.nin ?? '').toLowerCase().includes(q) ||
        (x.name ?? '').toLowerCase().includes(q) ||
        (x.first_name ?? '').toLowerCase().includes(q)
      )),
    );
  }

  get(id: number): Observable<ApiPatient> {
    return this.http.get<ApiPatient>(`${this.base}/${id}`);
  }

  create(input: ApiPatientCreate): Observable<ApiPatient> {
    return this.http.post<ApiPatient>(this.base, input);
  }

  update(id: number, input: ApiPatientUpdate): Observable<ApiPatient> {
    return this.http.patch<ApiPatient>(`${this.base}/${id}`, input);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // ── Legacy compat shims (return synchronous placeholder data) ───────

  /**
   * @deprecated Use `list()` for paginated `ApiPatient` data.
   * Returns an empty array synchronously — callers that need real data
   * should migrate to `list()` which returns Observable<Paginated<ApiPatient>>.
   */
  getPatients(): Patient[] {
    return [];
  }

  /** @deprecated Use `get(id)`. */
  getPatient(id: number): Patient | undefined {
    return undefined;
  }

  /** @deprecated Radiology/lab endpoints have moved out of PatientService. */
  getRadioRequests(): RadioRequest[] { return []; }
  /** @deprecated */
  getUrgentRadioRequests(): RadioRequest[] { return []; }
  /** @deprecated */
  getLabRequests(): LabRequest[] { return []; }
  /** @deprecated There is no "current patient" concept on the new API. */
  getCurrentPatient(): Patient | undefined { return undefined; }
}

/** Project a real backend patient onto the legacy mock shape. */
function mapApiToLegacy(p: ApiPatient): Patient {
  const fullName = [p.first_name, p.name].filter(Boolean).join(' ').trim()
    || p.patient_matricule
    || `Patient #${p.id}`;
  return {
    id: p.id,
    fullName,
    dob: p.date_of_birth ?? '',
    // Fields below have no equivalent on Patient any more — they live on
    // Admission. Migrate the call site to fetch admissions separately.
    admissionNumber: p.id,
    service: '',
    medecin: '',
    dateAdmission: '',
    statut: 'normal',
    queueNumber: 0,
  };
}
