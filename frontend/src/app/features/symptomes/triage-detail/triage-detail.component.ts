import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MockDataService } from '../../../core/services/mock-data.service';
import { PatientService } from '../../../core/services/patient.service';
import { Triage, NiveauUrgence } from '../../../core/models/symptome.model';

@Component({
  selector: 'app-triage-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="td-page">
      @if (triage()) {
        <div class="td-header">
          <button class="btn-back" routerLink="/symptomes"><mat-icon>arrow_back</mat-icon></button>
          <div>
            <h1 class="td-title">Fiche de triage — {{ patientName() }}</h1>
            <p class="td-sub">{{ triage()!.dateHeure | date:'dd/MM/yyyy HH:mm' }} · {{ triage()!.infirmier }}</p>
          </div>
          <span class="urgence-badge" [class]="'u-' + triage()!.niveauUrgence.toLowerCase()">
            {{ urgenceLabel(triage()!.niveauUrgence) }}
          </span>
        </div>

        <div class="td-grid">
          <div class="td-card">
            <h3 class="tdc-title"><mat-icon>monitor_heart</mat-icon> Constantes vitales</h3>
            <div class="vitals-display">
              <div class="vd-item" [class.warn]="triage()!.temperature! > 38.5">
                <mat-icon>thermostat</mat-icon>
                <div><span class="vd-val">{{ triage()!.temperature ?? '—' }}</span><span class="vd-unit">°C</span></div>
                <span class="vd-label">Température</span>
              </div>
              <div class="vd-item" [class.warn]="triage()!.tensionSystolique! > 140">
                <mat-icon>bloodtype</mat-icon>
                <div><span class="vd-val">{{ triage()!.tensionSystolique }}/{{ triage()!.tensionDiastolique }}</span><span class="vd-unit">mmHg</span></div>
                <span class="vd-label">Tension artérielle</span>
              </div>
              <div class="vd-item" [class.crit]="triage()!.frequenceCardiaque! > 120">
                <mat-icon>favorite</mat-icon>
                <div><span class="vd-val">{{ triage()!.frequenceCardiaque ?? '—' }}</span><span class="vd-unit">bpm</span></div>
                <span class="vd-label">Fréquence cardiaque</span>
              </div>
              <div class="vd-item" [class.crit]="triage()!.saturationO2! < 90" [class.warn]="triage()!.saturationO2! < 94">
                <mat-icon>air</mat-icon>
                <div><span class="vd-val">{{ triage()!.saturationO2 ?? '—' }}</span><span class="vd-unit">%</span></div>
                <span class="vd-label">SpO₂</span>
              </div>
              <div class="vd-item">
                <mat-icon>scale</mat-icon>
                <div><span class="vd-val">{{ triage()!.poids ?? '—' }}</span><span class="vd-unit">kg</span></div>
                <span class="vd-label">Poids</span>
              </div>
            </div>
          </div>

          <div class="td-card">
            <h3 class="tdc-title"><mat-icon>sick</mat-icon> Symptômes</h3>
            <div class="symp-chips">
              @for (s of triage()!.symptomes; track s) {
                <span class="symp-chip">{{ s }}</span>
              }
            </div>
            <div class="pain-display">
              <span>Score de douleur:</span>
              <strong class="pain-val" [class]="painClass(triage()!.douleur)">{{ triage()!.douleur }} / 10</strong>
            </div>
          </div>

          @if (triage()!.notes) {
            <div class="td-card full">
              <h3 class="tdc-title"><mat-icon>notes</mat-icon> Notes infirmier</h3>
              <p class="notes-text">{{ triage()!.notes }}</p>
            </div>
          }

          <div class="td-card">
            <h3 class="tdc-title"><mat-icon>directions</mat-icon> Orientation</h3>
            <p class="orient-text">{{ triage()!.orientationService ?? 'Non renseignée' }}</p>
          </div>
        </div>
      } @else {
        <div class="not-found"><mat-icon>search_off</mat-icon><p>Fiche de triage introuvable</p></div>
      }
    </div>
  `,
  styles: [`
    .td-page { padding: var(--space-6); }
    .td-header { display: flex; align-items: flex-start; gap: var(--space-4); margin-bottom: var(--space-6); }
    .btn-back { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 6px; cursor: pointer; display: flex; }
    .td-title { font-size: 20px; font-weight: 700; margin: 0; }
    .td-sub { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; }
    .urgence-badge { margin-left: auto; padding: 6px 16px; border-radius: var(--radius-full); font-size: 13px; font-weight: 700; &.u-critique { background: rgba(229,57,53,0.1); color: #C62828; } &.u-urgent { background: rgba(255,152,0,0.1); color: #E65100; } &.u-normal { background: rgba(76,175,80,0.1); color: #2E7D32; } }
    .td-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); }
    .td-card { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-md); &.full { grid-column: 1 / -1; } }
    .tdc-title { display: flex; align-items: center; gap: var(--space-2); font-size: 13px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin: 0 0 var(--space-4); mat-icon { font-size: 16px; color: var(--color-primary); } }
    .vitals-display { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); }
    .vd-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: var(--space-3); border-radius: var(--radius-md); background: var(--color-background); text-align: center; mat-icon { color: var(--color-primary); } .vd-val { font-size: 20px; font-weight: 700; color: var(--color-text); } .vd-unit { font-size: 11px; color: var(--color-text-muted); } .vd-label { font-size: 11px; color: var(--color-text-muted); } &.warn { border: 1px solid #FF9800; background: rgba(255,152,0,0.05); } &.crit { border: 1px solid #E53935; background: rgba(229,57,53,0.05); } }
    .symp-chips { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-4); }
    .symp-chip { background: rgba(0,188,212,0.1); color: var(--color-primary); border-radius: var(--radius-full); padding: 4px 12px; font-size: 12px; font-weight: 500; }
    .pain-display { display: flex; align-items: center; gap: var(--space-3); font-size: 14px; }
    .pain-val { font-size: 20px; &.pain-low { color: #2E7D32; } &.pain-mid { color: #E65100; } &.pain-high { color: #C62828; } }
    .notes-text { font-size: 14px; color: var(--color-text); line-height: 1.7; background: var(--color-background); padding: var(--space-3); border-radius: var(--radius-md); margin: 0; }
    .orient-text { font-size: 16px; font-weight: 600; color: var(--color-text); }
    .not-found { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-10); color: var(--color-text-muted); text-align: center; mat-icon { font-size: 48px; } }
  `]
})
export class TriageDetailComponent implements OnInit {
  private mockData = inject(MockDataService);
  private patientSvc = inject(PatientService);
  private route = inject(ActivatedRoute);

  triage = signal<Triage | null>(null);
  patientName = computed(() => {
    const t = this.triage();
    if (!t) return '';
    const p = this.patientSvc.getPatient(+t.patientId);
    return p ? p.fullName : `Patient #${t.patientId}`;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    const triageData = this.mockData.getTriage(id);
    this.triage.set(triageData ?? null);
  }

  urgenceLabel(n: NiveauUrgence): string {
    const m: Record<NiveauUrgence, string> = { CRITIQUE: 'CRITIQUE', URGENT: 'Urgent', SEMI_URGENT: 'Semi-urgent', NON_URGENT: 'Non urgent', NORMAL: 'Normal' };
    return m[n];
  }

  painClass(v: number): string { return v <= 3 ? 'pain-low' : v <= 6 ? 'pain-mid' : 'pain-high'; }
}
