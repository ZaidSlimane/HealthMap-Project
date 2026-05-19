import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner.component';
import { environment } from '../../../environments/environment';

/**
 * @deprecated Use {@link DossierPageComponent} from `features/services/dossier/dossier-page.component.ts` instead.
 * This component has been replaced by the full Patient Dossier implementation.
 * Route `/services/:serviceId/admission/:admissionId` now points to DossierPageComponent.
 */
@Component({
  selector: 'app-admission-resume',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <hm-spinner label="Chargement du dossier..." />
    } @else {
      <!-- Top banner: patient identity + admission info + bed info -->
      <div class="resume-banner">
        <div class="banner-card banner-patient">
          <span class="material-icons banner-icon">person</span>
          <div>
            <div class="banner-label">Patient</div>
            <div class="banner-value">{{ admission()?.patient?.name }} {{ admission()?.patient?.first_name }}</div>
          </div>
        </div>
        <div class="banner-card banner-admission">
          <span class="material-icons banner-icon">local_hospital</span>
          <div>
            <div class="banner-label">Admission N° {{ admission()?.id }}</div>
            <div class="banner-value">{{ admission()?.date_admission | date:'dd/MM/yyyy HH:mm' }}</div>
          </div>
        </div>
        <div class="banner-card banner-bed">
          <span class="material-icons banner-icon">hotel</span>
          <div>
            <div class="banner-label">{{ admission()?.service?.name }}</div>
            <div class="banner-value">{{ admission()?.bed?.bed_number || '—' }}</div>
          </div>
        </div>
        <button class="btn-back" (click)="goBack()">
          <span class="material-icons">arrow_back</span>
          Revenir au service
        </button>
      </div>

      <!-- Motif -->
      @if (admission()?.motif_admission) {
        <div class="motif-bar">
          <strong>Motif d'admission :</strong> {{ admission()?.motif_admission }}
        </div>
      }

      <!-- Clinical sections -->
      <div class="resume-grid">
        <!-- Left column -->
        <div class="resume-left">
          <div class="section-card">
            <h3 class="section-title">Observations médicales</h3>
            <p class="section-empty">Aucune observation enregistrée.</p>
          </div>

          <div class="section-card">
            <h3 class="section-title">Diagnostic</h3>
            <p class="section-empty">Aucun diagnostic enregistré.</p>
          </div>

          <div class="section-card">
            <h3 class="section-title">Antécédents médicaux</h3>
            <p class="section-empty">Aucun antécédent enregistré.</p>
          </div>

          <div class="section-card">
            <h3 class="section-title">Médicaments</h3>
            <p class="section-empty">Aucune prescription active.</p>
          </div>
        </div>

        <!-- Right column -->
        <div class="resume-right">
          <div class="section-card">
            <h3 class="section-title">Signes vitaux</h3>
            <p class="section-empty">Aucune mesure enregistrée.</p>
          </div>

          <div class="section-card">
            <h3 class="section-title">Examens demandés</h3>
            <p class="section-empty">Aucun examen en cours.</p>
          </div>

          <div class="section-card">
            <h3 class="section-title">Historique des admissions</h3>
            <p class="section-empty">Première admission.</p>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .resume-banner {
      display: flex;
      align-items: stretch;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .banner-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      border-radius: var(--radius-md, 10px);
      flex: 1;
      min-width: 180px;
    }

    .banner-patient { background: #16a34a; color: #fff; }
    .banner-admission { background: #ea580c; color: #fff; }
    .banner-bed { background: #2563eb; color: #fff; }

    .banner-icon { font-size: 28px; opacity: 0.8; }
    .banner-label { font-size: 11px; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.05em; }
    .banner-value { font-size: 15px; font-weight: 700; margin-top: 2px; }

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
    }

    .btn-back:hover { border-color: var(--color-primary, #00BCD4); color: var(--color-primary, #00BCD4); }
    .btn-back .material-icons { font-size: 16px; }

    .motif-bar {
      padding: 12px 18px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: var(--radius-md, 10px);
      font-size: 14px;
      color: #92400e;
      margin-bottom: 20px;
    }

    .resume-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    @media (max-width: 900px) {
      .resume-grid { grid-template-columns: 1fr; }
    }

    .resume-left, .resume-right {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-card {
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      padding: 16px;
    }

    .section-title {
      margin: 0 0 10px;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
    }

    .section-empty {
      margin: 0;
      font-size: 13px;
      color: var(--color-text-muted, #64748b);
      font-style: italic;
    }
  `]
})
export class AdmissionResumeComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  readonly admission = signal<any>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const admissionId = Number(this.route.snapshot.paramMap.get('admissionId'));
    if (admissionId) {
      this.loadAdmission(admissionId);
    }
  }

  goBack(): void {
    const serviceId = this.route.snapshot.paramMap.get('serviceId');
    this.router.navigate(['/services', serviceId]);
  }

  private loadAdmission(id: number): void {
    this.http.get<any>(`${environment.baseUrl}/clinical-core/admissions/${id}`).subscribe({
      next: (data) => {
        this.admission.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
