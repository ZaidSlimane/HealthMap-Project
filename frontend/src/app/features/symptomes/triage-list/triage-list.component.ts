import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MockDataService } from '../../../core/services/mock-data.service';
import { PatientService } from '../../../core/services/patient.service';
import { NiveauUrgence, Triage } from '../../../core/models/symptome.model';

@Component({
  selector: 'app-triage-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Symptômes & Triage Infirmier</h1>
          <p class="page-sub">Évaluation des patients à l'accueil</p>
        </div>
        <button class="btn-teal" routerLink="nouveau"><mat-icon>add</mat-icon> Nouveau triage</button>
      </div>

      <div class="kpi-strip">
        <div class="kpi-card kpi-critique">
          <span class="kpi-val">{{ countByNiveau('CRITIQUE') }}</span>
          <span class="kpi-label">Critique</span>
        </div>
        <div class="kpi-card kpi-urgent">
          <span class="kpi-val">{{ countByNiveau('URGENT') }}</span>
          <span class="kpi-label">Urgent</span>
        </div>
        <div class="kpi-card kpi-semi">
          <span class="kpi-val">{{ countByNiveau('SEMI_URGENT') }}</span>
          <span class="kpi-label">Semi-urgent</span>
        </div>
        <div class="kpi-card kpi-normal">
          <span class="kpi-val">{{ countByNiveau('NORMAL') }}</span>
          <span class="kpi-label">Normal</span>
        </div>
      </div>

      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Heure</th>
              <th>Patient</th>
              <th>Symptômes</th>
              <th>Constantes</th>
              <th>Douleur</th>
              <th>Urgence</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (t of triages(); track t.id) {
              <tr>
                <td class="td-time">{{ t.dateHeure | date:'HH:mm' }}</td>
                <td class="td-patient">{{ getPatientName(t.patientId) }}</td>
                <td>
                  <div class="symptom-chips">
                    @for (s of t.symptomes.slice(0, 2); track s) {
                      <span class="symp-chip">{{ s }}</span>
                    }
                    @if (t.symptomes.length > 2) {
                      <span class="symp-more">+{{ t.symptomes.length - 2 }}</span>
                    }
                  </div>
                </td>
                <td>
                  <div class="constantes">
                    @if (t.temperature) {
                      <span class="const-item" [class.warn]="t.temperature! > 38.5" [class.crit]="t.temperature! > 39.5">
                        T° {{ t.temperature }}°
                      </span>
                    }
                    @if (t.tensionSystolique) {
                      <span class="const-item" [class.warn]="t.tensionSystolique! > 140">
                        TA {{ t.tensionSystolique }}/{{ t.tensionDiastolique }}
                      </span>
                    }
                    @if (t.frequenceCardiaque) {
                      <span class="const-item" [class.crit]="t.frequenceCardiaque! > 120">
                        FC {{ t.frequenceCardiaque }}
                      </span>
                    }
                    @if (t.saturationO2) {
                      <span class="const-item" [class.crit]="t.saturationO2! < 90" [class.warn]="t.saturationO2! < 94">
                        SpO₂ {{ t.saturationO2 }}%
                      </span>
                    }
                  </div>
                </td>
                <td>
                  <div class="pain-bar">
                    <div class="pb-fill" [style.width.%]="t.douleur * 10" [class]="painClass(t.douleur)"></div>
                    <span class="pb-val">{{ t.douleur }}/10</span>
                  </div>
                </td>
                <td>
                  <span class="urgence-badge" [class]="'u-' + t.niveauUrgence.toLowerCase()">
                    {{ urgenceLabel(t.niveauUrgence) }}
                  </span>
                </td>
                <td>
                  <button class="action-btn" [routerLink]="['/symptomes', t.id]"><mat-icon>visibility</mat-icon></button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: var(--space-6); }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5); }
    .page-title { font-size: 22px; font-weight: 700; margin: 0; }
    .page-sub { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; }
    .kpi-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-5); }
    .kpi-card { border-radius: var(--radius-xl); padding: var(--space-4); text-align: center; box-shadow: var(--shadow-md); display: flex; flex-direction: column; gap: var(--space-1);
      .kpi-val { font-size: 32px; font-weight: 700; }
      .kpi-label { font-size: 12px; font-weight: 600; text-transform: uppercase; }
      &.kpi-critique { background: rgba(229,57,53,0.1); border-top: 3px solid #E53935; .kpi-val { color: #E53935; } .kpi-label { color: #C62828; } }
      &.kpi-urgent { background: rgba(255,152,0,0.1); border-top: 3px solid #FF9800; .kpi-val { color: #E65100; } .kpi-label { color: #E65100; } }
      &.kpi-semi { background: rgba(255,193,7,0.1); border-top: 3px solid #FFC107; .kpi-val { color: #F57F17; } .kpi-label { color: #F57F17; } }
      &.kpi-normal { background: rgba(76,175,80,0.1); border-top: 3px solid #4CAF50; .kpi-val { color: #2E7D32; } .kpi-label { color: #2E7D32; } }
    }
    .table-card { background: var(--color-surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse;
      th { padding: var(--space-3) var(--space-4); text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); background: var(--color-background); border-bottom: 1px solid var(--color-border); }
      td { padding: var(--space-3) var(--space-4); font-size: 13px; border-bottom: 1px solid var(--color-border); vertical-align: middle; }
      tr:last-child td { border-bottom: none; }
    }
    .td-time { font-family: var(--font-mono); font-weight: 600; color: var(--color-text-muted); }
    .td-patient { font-weight: 600; color: var(--color-text); }
    .symptom-chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .symp-chip { background: rgba(0,188,212,0.08); color: var(--color-primary); border-radius: var(--radius-full); padding: 2px 8px; font-size: 11px; font-weight: 500; }
    .symp-more { background: var(--color-background); color: var(--color-text-muted); border-radius: var(--radius-full); padding: 2px 6px; font-size: 11px; }
    .constantes { display: flex; flex-wrap: wrap; gap: 4px; }
    .const-item { font-size: 11px; padding: 2px 6px; border-radius: var(--radius-sm); background: rgba(76,175,80,0.08); color: #2E7D32;
      &.warn { background: rgba(255,152,0,0.1); color: #E65100; }
      &.crit { background: rgba(229,57,53,0.1); color: #C62828; }
    }
    .pain-bar { display: flex; align-items: center; gap: var(--space-2); }
    .pb-fill { height: 6px; border-radius: var(--radius-full); min-width: 4px; transition: width 0.3s;
      &.pain-low { background: #4CAF50; }
      &.pain-mid { background: #FF9800; }
      &.pain-high { background: #E53935; }
    }
    .pb-val { font-size: 11px; font-weight: 600; color: var(--color-text-muted); white-space: nowrap; }
    .urgence-badge { padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700;
      &.u-critique { background: rgba(229,57,53,0.12); color: #C62828; animation: pulse 1.5s infinite; }
      &.u-urgent { background: rgba(255,152,0,0.12); color: #E65100; }
      &.u-semi_urgent { background: rgba(255,193,7,0.12); color: #F57F17; }
      &.u-non_urgent { background: rgba(33,150,243,0.12); color: #1565C0; }
      &.u-normal { background: rgba(76,175,80,0.12); color: #2E7D32; }
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    .action-btn { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 4px; cursor: pointer; color: var(--color-text-muted); display: flex; mat-icon { font-size: 16px; } &:hover { color: var(--color-primary); } }
    .btn-teal { display: inline-flex; align-items: center; gap: var(--space-2); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 13px; font-weight: 600; cursor: pointer; mat-icon { font-size: 18px; } }
  `]
})
export class TriageListComponent {
  private mockData = inject(MockDataService);
  private patientSvc = inject(PatientService);

  triages = computed(() => this.mockData.getTriages().sort((a, b) => {
    const order = { CRITIQUE: 0, URGENT: 1, SEMI_URGENT: 2, NON_URGENT: 3, NORMAL: 4 };
    return order[a.niveauUrgence] - order[b.niveauUrgence];
  }));

  countByNiveau(n: NiveauUrgence): number {
    return this.mockData.getTriages().filter(t => t.niveauUrgence === n).length;
  }

  getPatientName(id: string): string {
    const p = this.patientSvc.getPatient(+id);
    return p ? p.fullName : `Patient #${id}`;
  }

  urgenceLabel(n: NiveauUrgence): string {
    const m: Record<NiveauUrgence, string> = { CRITIQUE: 'CRITIQUE', URGENT: 'Urgent', SEMI_URGENT: 'Semi-urgent', NON_URGENT: 'Non urgent', NORMAL: 'Normal' };
    return m[n];
  }

  painClass(v: number): string {
    if (v <= 3) return 'pain-low';
    if (v <= 6) return 'pain-mid';
    return 'pain-high';
  }
}
