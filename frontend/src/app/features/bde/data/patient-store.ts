import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Patient, DossierMedical, EtatSortie, AdmissionEntree, PatientWithDossier,
} from '../models/patient.model';

/** Backend `admissions.mode` enum. Duplicated here to avoid a circular
 *  import between AdmissionRequestService and PatientStore. */
type ApiAdmissionMode = 'normale' | 'urgence' | 'programmee';

/** Map the backend mode back to the French label the local UI stores. */
const API_MODE_TO_LABEL: Record<ApiAdmissionMode, AdmissionEntree['mode']> = {
  normale: 'Admission normale',
  urgence: 'Urgence',
  programmee: 'Programmée',
};

/** Payload accepted by `recordAdmissionFromRequest`. */
export interface RecordAdmissionInput {
  /** Free-text identity captured by the bed-management form. */
  nom: string;
  prenom: string;
  /** Real backend ids; required to build a valid Admission row. */
  serviceId: number;
  bedId: number | null;
  companionId: number | null;
  /** Backend enums. */
  mode: ApiAdmissionMode;
  motif: string;
  medecin: string;
  /** Optional pre-resolved patient id; when omitted we look up by NIN/name. */
  patientId?: number;
  /** Display labels persisted on the local Dossier so /bde/admis stays human-readable. */
  serviceLabel?: string;
  uniteLabel?: string;
}

/** What the caller gets back after a successful POST. */
export interface RecordAdmissionResult {
  patientId: number;
  dossierId: string;
  admissionId: number;
}

const SEED_PATIENTS: Array<{ p: Omit<Patient,'id'|'createdAt'|'dossierId'>; sortie: EtatSortie; service: string; medecin: string; date: string; }> = [
  { p: { nomFr: 'Benali', prenomFr: 'Karim', nomAr: 'بن علي', prenomAr: 'كريم', genre: 'M', dateNaissance: '1985-03-15', nationalite: 'Algérienne', telephone: '0550 12 34 56', adresse: { rue: 'Rue Larbi Ben M\'hidi', ville: 'Constantine', wilaya: 'Constantine', codePostal: '25000' }, nin: '198503150025001234' }, sortie: 'EN_COURS', service: 'Cardiologie', medecin: 'Dr. Bennaoum Nour', date: '2026-04-15' },
  { p: { nomFr: 'Meziani', prenomFr: 'Fatima', genre: 'F', dateNaissance: '1992-07-22', nationalite: 'Algérienne', telephone: '0660 22 33 44', adresse: { rue: 'Cité Filali', ville: 'Constantine', wilaya: 'Constantine' } }, sortie: 'GUERISON', service: 'Gynécologie', medecin: 'Dr. Boussaid F', date: '2026-04-12' },
  { p: { nomFr: 'Larbi', prenomFr: 'Ahmed', genre: 'M', dateNaissance: '1978-11-08', nationalite: 'Algérienne', adresse: { rue: 'Bd de l\'ALN', ville: 'Constantine', wilaya: 'Constantine' } }, sortie: 'AMELIORATION', service: 'Cardiologie', medecin: 'Dr. Khelili M', date: '2026-04-14' },
  { p: { nomFr: 'Aouadi', prenomFr: 'Nassima', genre: 'F', dateNaissance: '2000-01-01', nationalite: 'Algérienne', adresse: { rue: 'Cité Boussouf', ville: 'Constantine', wilaya: 'Constantine' } }, sortie: 'TRANSFERT', service: 'Gynécologie', medecin: 'Dr. Boussaid F', date: '2026-04-10' },
  { p: { nomFr: 'Brahimi', prenomFr: 'Omar', genre: 'M', dateNaissance: '1965-05-30', nationalite: 'Algérienne', adresse: { rue: 'El Khroub', ville: 'El Khroub', wilaya: 'Constantine' } }, sortie: 'DECES', service: 'Hémodialyse', medecin: 'Dr. Chouchan M', date: '2026-04-08' },
  { p: { nomFr: 'Boucherit', prenomFr: 'Samira', genre: 'F', dateNaissance: '1990-12-03', nationalite: 'Algérienne', adresse: { rue: 'Sidi Mabrouk', ville: 'Constantine', wilaya: 'Constantine' } }, sortie: 'CONTRE_AVIS', service: 'Médecine interne', medecin: 'Dr. Khelili M', date: '2026-04-09' },
  { p: { nomFr: 'Hadj Ali', prenomFr: 'Rachid', genre: 'M', dateNaissance: '1955-06-18', nationalite: 'Algérienne', adresse: { rue: 'Belle Vue', ville: 'Constantine', wilaya: 'Constantine' } }, sortie: 'EVASION', service: 'Cardiologie', medecin: 'Dr. Bennaoum Nour', date: '2026-04-11' },
  { p: { nomFr: 'Ferhat', prenomFr: 'Zineb', genre: 'F', dateNaissance: '2003-09-25', nationalite: 'Algérienne', adresse: { rue: 'Zouaghi', ville: 'Constantine', wilaya: 'Constantine' } }, sortie: 'NON_VENU', service: 'Consultation externe', medecin: 'Dr. Mesdour R', date: '2026-04-13' },
  { p: { nomFr: 'Kharroubi', prenomFr: 'Yacine', genre: 'M', dateNaissance: '1988-02-14', nationalite: 'Algérienne', adresse: { rue: 'Daksi', ville: 'Constantine', wilaya: 'Constantine' } }, sortie: 'EN_COURS', service: 'Chirurgie générale', medecin: 'Dr. Hamidi K', date: '2026-04-16' },
  { p: { nomFr: 'Saidi', prenomFr: 'Lila', genre: 'F', dateNaissance: '1995-08-20', nationalite: 'Algérienne', adresse: { rue: 'Ain El Bey', ville: 'Constantine', wilaya: 'Constantine' } }, sortie: 'GUERISON', service: 'Pédiatrie', medecin: 'Dr. Hamidi K', date: '2026-04-07' },
  { p: { nomFr: 'Ouahab', prenomFr: 'Hamza', genre: 'M', dateNaissance: '1972-12-10', nationalite: 'Algérienne', adresse: { rue: 'Massinissa', ville: 'Constantine', wilaya: 'Constantine' } }, sortie: 'EN_COURS', service: 'Néphrologie', medecin: 'Dr. Chouchan M', date: '2026-04-17' },
  { p: { nomFr: 'Rezig', prenomFr: 'Amel', genre: 'F', dateNaissance: '1980-04-05', nationalite: 'Algérienne', adresse: { rue: 'Ziadia', ville: 'Constantine', wilaya: 'Constantine' } }, sortie: 'EN_COURS', service: 'Maxillo-faciale', medecin: 'Dr. Bennaoum Nour', date: '2026-04-18' },
];

const STORAGE_KEY = 'healthmap.bde.patientstore.v1';

@Injectable({ providedIn: 'root' })
export class PatientStore {
  private http = inject(HttpClient);
  private readonly admissionsUrl = `${environment.baseUrl}/clinical-core/admissions`;
  private readonly patientsUrl = `${environment.baseUrl}/clinical-core/patients`;

  private _patients = signal<Patient[]>([]);
  private _dossiers = signal<DossierMedical[]>([]);

  readonly patients = this._patients.asReadonly();
  readonly dossiers = this._dossiers.asReadonly();

  constructor() {
    if (!this.loadFromStorage()) {
      this.seed();
      this.persist();
    }
  }

  private loadFromStorage(): boolean {
    try {
      if (typeof localStorage === 'undefined') return false;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as { patients: Patient[]; dossiers: DossierMedical[] };
      if (!parsed?.patients || !parsed?.dossiers) return false;
      this._patients.set(parsed.patients);
      this._dossiers.set(parsed.dossiers);
      return true;
    } catch { return false; }
  }

  private persist(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        patients: this._patients(), dossiers: this._dossiers(),
      }));
    } catch { /* ignore quota errors */ }
  }

  private seed(): void {
    const patients: Patient[] = [];
    const dossiers: DossierMedical[] = [];
    SEED_PATIENTS.forEach((s, idx) => {
      const id = 'pat-seed-' + (idx + 1);
      const dossierId = this.makeDossierId(idx + 1);
      const patient: Patient = {
        id,
        ...s.p,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * (12 - idx),
        dossierId,
      };
      const adm: AdmissionEntree = {
        id: 'adm-' + id,
        dossierId,
        date: s.date,
        service: s.service,
        motif: 'Prise en charge initiale',
        medecin: s.medecin,
        mode: 'Admission normale',
        etatSortie: s.sortie,
        dateSortie: s.sortie === 'EN_COURS' ? undefined : s.date,
      };
      const dossier: DossierMedical = {
        id: dossierId,
        patientId: id,
        ouvertLe: patient.createdAt,
        parcours: [adm],
        facturation: {
          typePriseEnCharge: idx % 3 === 0 ? 'Assurance' : 'Payant',
          assurance: idx % 3 === 0 ? { organisme: 'CNAS', numero: 'A-' + (1000 + idx) } : undefined,
          montantTotal: 0,
          montantRegle: 0,
        },
        impressions: { bulletinAdmissionImprime: false, bulletinSortieImprime: false, fichierMedicalImprime: false },
      };
      patients.push(patient);
      dossiers.push(dossier);
    });
    this._patients.set(patients);
    this._dossiers.set(dossiers);
  }

  private makeDossierId(seq: number): string {
    const yr = new Date().getFullYear();
    return `D-${yr}-${String(seq).padStart(5, '0')}`;
  }

  byId(id: string): PatientWithDossier | null {
    const p = this._patients().find(x => x.id === id);
    if (!p) return null;
    const d = this._dossiers().find(x => x.id === p.dossierId);
    if (!d) return null;
    return { patient: p, dossier: d };
  }

  byIdSignal(id: () => string) {
    return computed(() => this.byId(id()));
  }

  add(input: Omit<Patient, 'id' | 'createdAt' | 'dossierId'>): PatientWithDossier {
    const seq = this._patients().length + 1;
    const id = 'pat-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const dossierId = this.makeDossierId(seq);
    const patient: Patient = { ...input, id, dossierId, createdAt: Date.now() };
    const dossier: DossierMedical = {
      id: dossierId,
      patientId: id,
      ouvertLe: patient.createdAt,
      parcours: [],
      facturation: { typePriseEnCharge: null, montantTotal: 0, montantRegle: 0 },
      impressions: { bulletinAdmissionImprime: false, bulletinSortieImprime: false, fichierMedicalImprime: false },
    };
    this._patients.update(list => [patient, ...list]);
    this._dossiers.update(list => [dossier, ...list]);
    this.persist();
    return { patient, dossier };
  }

  /**
   * POST a real admission to /clinical-core/admissions and mirror it into
   * the local dossier so /bde/admis shows it immediately.
   *
   * Patient resolution order:
   *   1. `input.patientId` if provided.
   *   2. Otherwise create a minimal Patient on the backend via NIN derived
   *      from the form's free-text name (placeholder `NIN-{ts}`). The real
   *      patient form will replace this once it lives on the backend.
   *
   * Bed status is flipped server-side by the Admission model observer, so
   * callers no longer need to call `ServicesStore.setBedStatus`.
   */
  recordAdmissionFromRequest(input: RecordAdmissionInput): Observable<RecordAdmissionResult> {
    const apiPatientId$ = input.patientId !== undefined
      ? of(input.patientId)
      : this.ensureBackendPatient(input).pipe(map(p => p.id));

    return apiPatientId$.pipe(
      switchMap(apiPatientId => {
        const payload = {
          patient_id: apiPatientId,
          service_id: input.serviceId,
          bed_id: input.bedId,
          companion_id: input.companionId,
          date_admission: new Date().toISOString(),
          motif_admission: input.motif,
          mode: input.mode,
          status: 'active',
        };
        return this.http.post<{ id: number }>(this.admissionsUrl, payload).pipe(
          map(adm => ({ apiPatientId, admissionId: adm.id })),
        );
      }),
      tap(({ apiPatientId, admissionId }) => {
        this.mirrorAdmissionLocally(input, apiPatientId, admissionId);
      }),
      map(({ apiPatientId, admissionId }) => {
        const local = this.findLocalByApiId(apiPatientId);
        return {
          patientId: apiPatientId,
          dossierId: local?.dossierId ?? '',
          admissionId,
        };
      }),
    );
  }

  /**
   * Look up a patient on the backend by name; if none exists, create a
   * minimal one. The form will eventually capture NIN/INS/marital_status
   * directly so this fallback can be removed.
   */
  private ensureBackendPatient(input: RecordAdmissionInput): Observable<{ id: number }> {
    const placeholder = {
      nin: `NIN-${Date.now()}`,
      ins: `INS-${Date.now()}`,
      marital_status_id: 1,
      first_name: input.prenom,
      name: input.nom,
      gender: 'M' as const,
    };
    return this.http.post<{ id: number }>(this.patientsUrl, placeholder);
  }

  /**
   * Append an AdmissionEntree to the local dossier so the BDE list views
   * reflect the newly persisted admission without an extra round-trip.
   */
  private mirrorAdmissionLocally(
    input: RecordAdmissionInput,
    apiPatientId: number,
    _admissionId: number,
  ): void {
    const norm = (s: string) => s.trim().toLowerCase();
    const local = this._patients().find(
      p => norm(p.nomFr) === norm(input.nom) && norm(p.prenomFr) === norm(input.prenom)
    );
    let dossierId: string;
    if (local) {
      dossierId = local.dossierId;
    } else {
      const created = this.add({
        nomFr: input.nom, prenomFr: input.prenom,
        genre: 'M', dateNaissance: '1980-01-01',
        nationalite: 'Algérienne',
        adresse: { rue: '', ville: 'Constantine', wilaya: 'Constantine' },
      });
      dossierId = created.dossier.id;
    }

    const today = new Date().toISOString().slice(0, 10);
    const adm: AdmissionEntree = {
      id: 'adm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
      dossierId,
      date: today,
      service: input.serviceLabel ?? `Service #${input.serviceId}`,
      unite: input.uniteLabel,
      motif: input.motif,
      medecin: input.medecin,
      mode: API_MODE_TO_LABEL[input.mode],
      etatSortie: 'EN_COURS',
    };
    this._dossiers.update(list => list.map(d =>
      d.id === dossierId ? { ...d, parcours: [...d.parcours, adm] } : d
    ));
    this.persist();
  }

  private findLocalByApiId(_apiId: number): { dossierId: string } | null {
    // The local store only knows string ids today; once we persist the
    // backend patient_id alongside each Patient we can resolve by it.
    return null;
  }

  // ── Aggregations used by the dashboard ────────────────────
  readonly countByEtat = computed(() => {
    const out: Record<EtatSortie, number> = {
      EN_COURS: 0, GUERISON: 0, AMELIORATION: 0, TRANSFERT: 0,
      DECES: 0, EVASION: 0, CONTRE_AVIS: 0, NON_VENU: 0,
    };
    // Count by the *latest* admission per dossier so KPIs/cards match
    // the list pages (which filter by `lastAdm.etatSortie`).
    for (const d of this._dossiers()) {
      const last = d.parcours[d.parcours.length - 1];
      if (last) out[last.etatSortie]++;
    }
    return out;
  });

  readonly genreCounts = computed(() => {
    let m = 0, f = 0;
    for (const p of this._patients()) (p.genre === 'M' ? m++ : f++);
    return { M: m, F: f, total: m + f };
  });

  readonly admissionsLastDays = computed(() => {
    const days = 14;
    const today = new Date(); today.setHours(0,0,0,0);
    const buckets: { date: string; label: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0,10);
      buckets.push({ date: iso, label: `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`, count: 0 });
    }
    for (const d of this._dossiers()) {
      for (const a of d.parcours) {
        const b = buckets.find(x => x.date === a.date);
        if (b) b.count++;
      }
    }
    return buckets;
  });

  // Breakdown of admissions for the current month, grouped by ADMISSION TYPE
  // (Admission normale · Urgence · Évacuation · Autre) — per BDE spec.
  readonly thisMonthBreakdown = computed(() => {
    const ym = new Date().toISOString().slice(0, 7);
    const buckets: Record<'normale'|'urgence'|'evacuation'|'autre', number> = {
      normale: 0, urgence: 0, evacuation: 0, autre: 0,
    };
    let total = 0;
    for (const d of this._dossiers()) {
      for (const a of d.parcours) {
        if (a.date.slice(0, 7) !== ym) continue;
        const m = (a.mode || '').toLowerCase();
        if (m.includes('urgence')) buckets.urgence++;
        else if (m.includes('évacu') || m.includes('evacu') || m.includes('transf')) buckets.evacuation++;
        else if (m.includes('normale') || m.includes('programm')) buckets.normale++;
        else buckets.autre++;
        total++;
      }
    }
    return {
      total,
      rows: [
        { key: 'normale',    label: 'Admission normale', count: buckets.normale,    color: '#1E88E5', icon: 'how_to_reg' },
        { key: 'urgence',    label: 'Urgence',           count: buckets.urgence,    color: '#E53935', icon: 'local_hospital' },
        { key: 'evacuation', label: 'Évacuation',        count: buckets.evacuation, color: '#FB8C00', icon: 'airport_shuttle' },
        { key: 'autre',      label: 'Autre',             count: buckets.autre,      color: '#8E24AA', icon: 'more_horiz' },
      ],
    };
  });

  readonly admissionsByMonth = computed(() => {
    const months = 12;
    const today = new Date();
    const buckets: { ym: string; label: string; count: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'short' });
      buckets.push({ ym, label, count: 0 });
    }
    for (const d of this._dossiers()) {
      for (const a of d.parcours) {
        const ym = a.date.slice(0,7);
        const b = buckets.find(x => x.ym === ym);
        if (b) b.count++;
      }
    }
    return buckets;
  });
}
