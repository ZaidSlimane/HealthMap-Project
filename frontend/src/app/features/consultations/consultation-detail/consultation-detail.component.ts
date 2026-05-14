import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MockDataService } from '../../../core/services/mock-data.service';
import { PatientService } from '../../../core/services/patient.service';
import { Consultation } from '../../../core/models/consultation.model';

@Component({
  selector: 'app-consultation-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cd-page">
      @if (consultation()) {
        <div class="cd-header-bar">
          <button class="btn-back" routerLink="/consultations"><mat-icon>arrow_back</mat-icon></button>
          <div>
            <h1 class="cd-title">Consultation — {{ patientName() }}</h1>
            <p class="cd-sub">{{ consultation()!.dateHeure | date:'EEEE dd MMMM yyyy, HH:mm' }} · {{ consultation()!.medecin }}</p>
          </div>
          <div class="cd-hdr-actions">
            <button class="btn-outline" (click)="imprimer()"><mat-icon>print</mat-icon> Imprimer</button>
            <button class="btn-teal"><mat-icon>edit</mat-icon> Modifier</button>
          </div>
        </div>

        <div class="cd-body">
          <div class="cd-section-card">
            <div class="cs-title"><mat-icon>history_edu</mat-icon> Anamnèse</div>
            <p class="cs-text">{{ consultation()!.anamnese || 'Non renseignée' }}</p>
          </div>
          <div class="cd-section-card">
            <div class="cs-title"><mat-icon>health_and_safety</mat-icon> Examen clinique</div>
            <p class="cs-text">{{ consultation()!.examenClinique || 'Non renseigné' }}</p>
          </div>
          <div class="cd-section-card">
            <div class="cs-title"><mat-icon>local_hospital</mat-icon> Diagnostic</div>
            <p class="cs-text cd-diagnostic">{{ consultation()!.diagnosticPrincipal || 'Non renseigné' }}</p>
            @if (consultation()!.cim10Code) {
              <span class="cim-badge"><mat-icon>qr_code</mat-icon> CIM-10: {{ consultation()!.cim10Code }}</span>
            }
          </div>
          @if (consultation()!.prescriptions?.length) {
            <div class="cd-section-card">
              <div class="cs-title"><mat-icon>description</mat-icon> Prescriptions</div>
              <ul class="cs-list">
                @for (p of consultation()!.prescriptions!; track p) { <li>{{ p }}</li> }
              </ul>
            </div>
          }
          @if (consultation()!.examensdemandes?.length) {
            <div class="cd-section-card">
              <div class="cs-title"><mat-icon>biotech</mat-icon> Examens demandés</div>
              <ul class="cs-list">
                @for (e of consultation()!.examensdemandes!; track e) { <li>{{ e }}</li> }
              </ul>
            </div>
          }
        </div>
      } @else {
        <div class="cd-not-found">
          <mat-icon>search_off</mat-icon>
          <h2>Consultation introuvable</h2>
          <button class="btn-teal" routerLink="/consultations">Retour à la liste</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .cd-page { padding: var(--space-6); max-width: 900px; }
    .cd-header-bar { display: flex; align-items: flex-start; gap: var(--space-4); margin-bottom: var(--space-6); }
    .btn-back { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 6px; cursor: pointer; display: flex; }
    .cd-title { font-size: 20px; font-weight: 700; margin: 0; color: var(--color-text); }
    .cd-sub { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; }
    .cd-hdr-actions { margin-left: auto; display: flex; gap: var(--space-2); }
    .cd-body { display: flex; flex-direction: column; gap: var(--space-4); }
    .cd-section-card { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-md); }
    .cs-title { display: flex; align-items: center; gap: var(--space-2); font-size: 13px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-3); mat-icon { font-size: 16px; color: var(--color-primary); } }
    .cs-text { font-size: 14px; color: var(--color-text); line-height: 1.7; margin: 0; }
    .cd-diagnostic { font-weight: 600; font-size: 15px; }
    .cim-badge { display: inline-flex; align-items: center; gap: 4px; background: rgba(0,188,212,0.1); color: var(--color-primary); border-radius: var(--radius-full); padding: 4px 12px; font-size: 12px; font-weight: 700; margin-top: var(--space-2); mat-icon { font-size: 14px; } }
    .cs-list { margin: 0; padding-left: var(--space-5); li { font-size: 13px; color: var(--color-text); line-height: 2; } }
    .cd-not-found { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-10); text-align: center; color: var(--color-text-muted); mat-icon { font-size: 48px; } }
    .btn-teal { display: inline-flex; align-items: center; gap: var(--space-2); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); padding: 8px var(--space-4); font-size: 13px; font-weight: 600; cursor: pointer; mat-icon { font-size: 16px; } }
    .btn-outline { display: inline-flex; align-items: center; gap: var(--space-2); background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 8px var(--space-4); font-size: 13px; cursor: pointer; color: var(--color-text-muted); mat-icon { font-size: 16px; } }
  `]
})
export class ConsultationDetailComponent implements OnInit {
  private mockData = inject(MockDataService);
  private patientSvc = inject(PatientService);
  private route = inject(ActivatedRoute);

  consultation = signal<Consultation | null>(null);
  patientName = computed(() => {
    const c = this.consultation();
    if (!c) return '';
    const p = this.patientSvc.getPatient(+c.patientId);
    return p ? p.fullName : `Patient #${c.patientId}`;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    const consultationData = this.mockData.getConsultation(id);
    this.consultation.set(consultationData ?? null);
  }

  imprimer(): void { window.print(); }
}
