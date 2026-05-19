import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { TopBannerComponent } from './top-banner.component';
import { LeftSidebarComponent } from './left-sidebar.component';
import { MainTabbedAreaComponent } from './main-tabbed-area.component';
import { ActionsDropdownComponent } from './actions-dropdown.component';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

export interface DossierData {
  admission: any;
  patient: any;
  service: any;
  bed: any;
  companion: any;
  companions: any[];
  latestVitalSigns: any[];
  admissionHistory: any[];
  treatingDoctor?: any;
}

export interface SecondaryData {
  vitalSigns: any[];
  observations: any[];
  movements: any[];
  examRequests: any[];
  treatments: any[];
}

@Component({
  selector: 'app-dossier-page',
  standalone: true,
  imports: [
    CommonModule,
    SpinnerComponent,
    TopBannerComponent,
    LeftSidebarComponent,
    MainTabbedAreaComponent,
    ActionsDropdownComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <hm-spinner label="Chargement du dossier..." />
    } @else if (error()) {
      <div class="error-state">
        <span class="material-icons error-icon">error_outline</span>
        <p class="error-message">{{ error() }}</p>
        <button class="btn-back" (click)="goBack()">
          <span class="material-icons">arrow_back</span>
          Revenir au service
        </button>
      </div>
    } @else {
      <!-- Top Banner + Actions Dropdown -->
      <div class="dossier-top-row">
        <app-top-banner [dossierData]="bannerData()" />
        <app-actions-dropdown
          [admissionStatus]="admissionStatus()"
          (actionSelected)="onActionSelected($event)"
        />
      </div>

      <!-- Page body: sidebar + main area -->
      <div class="dossier-body">
        <!-- Left Sidebar -->
        <aside class="dossier-sidebar">
          <app-left-sidebar
            [patient]="sidebarPatient()"
            [admission]="sidebarAdmission()"
            [companion]="dossierData()?.companion ?? null"
            [companions]="dossierData()?.companions ?? []"
            [examRequests]="examRequests()"
            [admissionHistory]="dossierData()?.admissionHistory ?? []"
            [treatingDoctor]="treatingDoctorName()"
          />
        </aside>

        <!-- Main Tabbed Area -->
        <main class="dossier-main">
          @if (secondaryLoading()) {
            <hm-spinner label="Chargement des données secondaires..." [inline]="true" [size]="20" />
          } @else if (secondaryError()) {
            <div class="section-error">
              <span class="material-icons">warning</span>
              <span>{{ secondaryError() }}</span>
            </div>
          }
          <app-main-tabbed-area
            [vitalSigns]="vitalSigns()"
            [admissionId]="dossierData()?.admission?.id ?? 0"
            [patientId]="dossierData()?.patient?.id ?? 0"
            [treatments]="treatments()"
            [movements]="movements()"
            [observations]="observations()"
            [userRole]="userRole()"
          />
        </main>
      </div>
    }
  `,
  styles: [`
    /* === Error state === */
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 60px 20px;
      text-align: center;
    }

    .error-icon {
      font-size: 48px;
      color: #dc2626;
      opacity: 0.7;
    }

    .error-message {
      margin: 0;
      font-size: 15px;
      color: var(--color-text-muted, #64748b);
      max-width: 400px;
    }

    /* === Top row (banner + actions) === */
    .dossier-top-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .dossier-top-row app-top-banner {
      flex: 1;
      min-width: 0;
    }

    .dossier-top-row app-actions-dropdown {
      align-self: center;
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--color-border, #e2e8f0);
      background: var(--color-surface, #fff);
      color: var(--color-text-muted, #64748b);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      align-self: center;
      white-space: nowrap;
      transition: all 0.2s ease;
    }

    .btn-back:hover {
      border-color: var(--color-primary, #00BCD4);
      color: var(--color-primary, #00BCD4);
    }

    .btn-back .material-icons { font-size: 16px; }

    /* === Body layout === */
    .dossier-body {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 20px;
      align-items: start;
    }

    @media (max-width: 1000px) {
      .dossier-body { grid-template-columns: 1fr; }
    }

    /* === Sidebar === */
    .dossier-sidebar {
      background: var(--color-surface, #fff);
      border-radius: var(--radius-lg, 14px);
      border: 1px solid var(--color-border, #e2e8f0);
      padding: 16px;
      position: sticky;
      top: 20px;
    }

    /* === Main area === */
    .dossier-main {
      background: var(--color-surface, #fff);
      border-radius: var(--radius-lg, 14px);
      border: 1px solid var(--color-border, #e2e8f0);
      padding: 20px;
      min-height: 400px;
    }

    .section-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--radius-md, 10px);
      font-size: 13px;
      color: #dc2626;
      margin-bottom: 16px;
    }

    .section-error .material-icons {
      font-size: 18px;
    }
  `]
})
export class DossierPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly API = environment.baseUrl;

  // Primary data state
  readonly dossierData = signal<DossierData | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // Secondary data state
  readonly secondaryData = signal<SecondaryData | null>(null);
  readonly secondaryLoading = signal(false);
  readonly secondaryError = signal<string | null>(null);

  // Extracted signals for child components
  readonly vitalSigns = signal<any[]>([]);
  readonly observations = signal<any[]>([]);
  readonly movements = signal<any[]>([]);
  readonly examRequests = signal<any[]>([]);
  readonly treatments = signal<any[]>([]);

  /** Current user role for tab components */
  readonly userRole = computed(() => {
    const role = this.auth.getUserRole();
    return role ? role.toLowerCase() : null;
  });

  // ─── Computed signals for child component inputs ─────────────────────────────

  /** Data for TopBannerComponent */
  readonly bannerData = computed(() => {
    const data = this.dossierData();
    return {
      patient: data?.patient ?? { name: '', first_name: '', date_of_birth: '' },
      admission: data?.admission ?? { id: 0, date_admission: '' },
      service: data?.service ?? { id: 0, name: '' },
      bed: data?.bed ?? { bed_number: '—' },
    };
  });

  /** Admission status for ActionsDropdownComponent */
  readonly admissionStatus = computed(() => {
    return this.dossierData()?.admission?.status ?? 'pending';
  });

  /** Patient data for LeftSidebarComponent */
  readonly sidebarPatient = computed(() => {
    const p = this.dossierData()?.patient;
    return {
      id: p?.id ?? 0,
      name: p?.name ?? '',
      first_name: p?.first_name ?? '',
      blood_group: p?.blood_group ?? undefined,
      photo_url: p?.photo_url ?? undefined,
    };
  });

  /** Admission data for LeftSidebarComponent */
  readonly sidebarAdmission = computed(() => {
    const a = this.dossierData()?.admission;
    return {
      id: a?.id ?? 0,
      date_admission: a?.date_admission ?? '',
      motif_admission: a?.motif_admission ?? null,
      status: a?.status ?? 'pending',
      service: this.dossierData()?.service ? { name: this.dossierData()!.service.name } : undefined,
    };
  });

  /** Treating doctor name for LeftSidebarComponent */
  readonly treatingDoctorName = computed(() => {
    const doc = this.dossierData()?.treatingDoctor;
    if (!doc) return null;
    if (typeof doc === 'string') return doc;
    return doc.name ? `${doc.name} ${doc.first_name ?? ''}`.trim() : null;
  });

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const admissionId = Number(this.route.snapshot.paramMap.get('admissionId'));
    if (admissionId) {
      this.loadDossier(admissionId);
    } else {
      this.loading.set(false);
      this.error.set('Identifiant d\'admission invalide.');
    }
  }

  // ─── Public methods ──────────────────────────────────────────────────────────

  goBack(): void {
    const serviceId = this.route.snapshot.paramMap.get('serviceId');
    this.router.navigate(['/services', serviceId]);
  }

  /**
   * Handles action selection from ActionsDropdownComponent.
   * Routes to the appropriate dialog or form based on the action ID.
   */
  onActionSelected(actionId: string): void {
    const serviceId = this.route.snapshot.paramMap.get('serviceId');
    const admissionId = this.dossierData()?.admission?.id;

    switch (actionId) {
      case 'radio_exam':
        this.router.navigate(['/services', serviceId, 'admission', admissionId, 'radio-exam']);
        break;
      case 'bio_exam':
        this.router.navigate(['/services', serviceId, 'admission', admissionId, 'bio-exam']);
        break;
      case 'request_act':
        this.router.navigate(['/services', serviceId, 'admission', admissionId, 'request-act']);
        break;
      case 'prescribe_med':
        this.router.navigate(['/services', serviceId, 'admission', admissionId, 'prescribe']);
        break;
      case 'transfer':
        this.router.navigate(['/services', serviceId, 'admission', admissionId, 'transfer']);
        break;
      case 'companion_mgmt':
        this.router.navigate(['/services', serviceId, 'admission', admissionId, 'companions']);
        break;
      case 'file_mgmt':
        this.router.navigate(['/services', serviceId, 'admission', admissionId, 'files']);
        break;
      case 'specialist_opinion':
        this.router.navigate(['/services', serviceId, 'admission', admissionId, 'specialist-opinion']);
        break;
      case 'discharge':
        this.router.navigate(['/services', serviceId, 'admission', admissionId, 'discharge']);
        break;
      default:
        console.warn(`Action non gérée: ${actionId}`);
    }
  }

  // ─── Private methods ─────────────────────────────────────────────────────────

  private loadDossier(admissionId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<DossierData>(`${this.API}/clinical-core/admissions/${admissionId}/dossier`).subscribe({
      next: (data) => {
        this.dossierData.set(data);
        this.loading.set(false);
        // Trigger secondary data loading in parallel
        this.loadSecondaryData(admissionId);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.error.set('Admission introuvable. Veuillez vérifier l\'identifiant.');
        } else {
          this.error.set('Erreur lors du chargement du dossier. Veuillez réessayer.');
        }
      }
    });
  }

  private loadSecondaryData(admissionId: number): void {
    this.secondaryLoading.set(true);
    this.secondaryError.set(null);

    forkJoin({
      vitalSigns: this.http.get<any>(`${this.API}/clinical-core/vital-signs`, {
        params: { admission_id: admissionId }
      }),
      observations: this.http.get<any>(`${this.API}/clinical-core/observations`, {
        params: { admission_id: admissionId, type: 'paramedical' }
      }),
      movements: this.http.get<any>(`${this.API}/clinical-core/patient-movements`, {
        params: { admission_id: admissionId }
      }),
      examRequests: this.http.get<any>(`${this.API}/clinical-core/exam-requests`, {
        params: { admission_id: admissionId }
      }),
      treatments: this.http.get<any>(`${this.API}/clinical-core/prescriptions`, {
        params: { admission_id: admissionId }
      }),
    }).subscribe({
      next: (results) => {
        const extractData = (res: any) => res?.data ?? res ?? [];

        const secondary: SecondaryData = {
          vitalSigns: extractData(results.vitalSigns),
          observations: extractData(results.observations),
          movements: extractData(results.movements),
          examRequests: extractData(results.examRequests),
          treatments: extractData(results.treatments),
        };

        this.secondaryData.set(secondary);
        this.vitalSigns.set(secondary.vitalSigns);
        this.observations.set(secondary.observations);
        this.movements.set(secondary.movements);
        this.examRequests.set(secondary.examRequests);
        this.treatments.set(secondary.treatments);
        this.secondaryLoading.set(false);
      },
      error: () => {
        this.secondaryLoading.set(false);
        this.secondaryError.set('Certaines données secondaires n\'ont pas pu être chargées.');
      }
    });
  }
}
