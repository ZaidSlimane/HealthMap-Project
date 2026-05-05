import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { PatientService } from '../../../core/services/patient.service';
import { NiveauUrgence } from '../../../core/models/symptome.model';

@Component({
  selector: 'app-triage-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tf-page">
      <div class="tf-header">
        <button class="btn-back" routerLink="/symptomes"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <h1 class="tf-title">Évaluation / Triage infirmier</h1>
          <p class="tf-sub">Évaluation initiale du patient à l'accueil</p>
        </div>
      </div>

      <div class="patient-search-bar">
        <mat-icon>person_search</mat-icon>
        <input [(ngModel)]="patientSearch" placeholder="Rechercher patient par nom..." (input)="filterPatients()" />
        @if (patientSuggestions().length > 0) {
          <ul class="ps-dropdown">
            @for (p of patientSuggestions(); track p.id) {
              <li (click)="selectPatient(p)">{{ p.fullName }}</li>
            }
          </ul>
        }
      </div>

      <div class="tf-grid">
        <!-- Section 1: Constantes vitales -->
        <div class="tf-card">
          <h3 class="tf-card-title"><mat-icon>monitor_heart</mat-icon> Constantes vitales</h3>
          <div class="vitals-grid">
            <div class="vital-field" [class.warn]="temp() > 38.5">
              <mat-icon>thermostat</mat-icon>
              <div class="vf-inputs">
                <label>Température</label>
                <div class="vf-row"><input type="number" [(ngModel)]="temp" step="0.1" /><span class="vf-unit">°C</span></div>
              </div>
            </div>
            <div class="vital-field" [class.warn]="ta_sys() > 140">
              <mat-icon>bloodtype</mat-icon>
              <div class="vf-inputs">
                <label>Tension artérielle</label>
                <div class="vf-row">
                  <input type="number" [(ngModel)]="ta_sys" placeholder="sys" /><span>/</span>
                  <input type="number" [(ngModel)]="ta_dia" placeholder="dia" /><span class="vf-unit">mmHg</span>
                </div>
              </div>
            </div>
            <div class="vital-field" [class.warn]="fc() > 100" [class.crit]="fc() > 120">
              <mat-icon>favorite</mat-icon>
              <div class="vf-inputs">
                <label>Fréquence cardiaque</label>
                <div class="vf-row"><input type="number" [(ngModel)]="fc" /><span class="vf-unit">bpm</span></div>
              </div>
            </div>
            <div class="vital-field" [class.warn]="spo2() < 94" [class.crit]="spo2() < 90">
              <mat-icon>air</mat-icon>
              <div class="vf-inputs">
                <label>Saturation O₂</label>
                <div class="vf-row"><input type="number" [(ngModel)]="spo2" /><span class="vf-unit">%</span></div>
              </div>
            </div>
            <div class="vital-field">
              <mat-icon>scale</mat-icon>
              <div class="vf-inputs">
                <label>Poids</label>
                <div class="vf-row"><input type="number" [(ngModel)]="poids" /><span class="vf-unit">kg</span></div>
              </div>
            </div>
            <div class="vital-field">
              <span class="vf-bmi-label">IMC</span>
              <div class="vf-inputs">
                <label>Calculé automatiquement</label>
                <div class="vf-row"><span class="bmi-val">{{ bmi() }}</span><span class="vf-unit">kg/m²</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2: Symptômes -->
        <div class="tf-card">
          <h3 class="tf-card-title"><mat-icon>sick</mat-icon> Symptômes déclarés</h3>
          <div class="symp-shortcuts">
            @for (s of symptomShortcuts; track s) {
              <button type="button" class="symp-btn" [class.active]="selectedSymptomes().includes(s)" (click)="toggleSymptom(s)">{{ s }}</button>
            }
          </div>
          <div class="symp-input-wrap">
            <input [(ngModel)]="sympInput" placeholder="Ajouter un symptôme..." (keydown.enter)="addCustomSymptom()" />
            <button (click)="addCustomSymptom()"><mat-icon>add</mat-icon></button>
          </div>
          @if (selectedSymptomes().length > 0) {
            <div class="symp-chips">
              @for (s of selectedSymptomes(); track s) {
                <span class="symp-chip">{{ s }} <button (click)="removeSymptom(s)">×</button></span>
              }
            </div>
          }
        </div>

        <!-- Section 3: Score douleur -->
        <div class="tf-card">
          <h3 class="tf-card-title"><mat-icon>sentiment_very_dissatisfied</mat-icon> Score de douleur</h3>
          <div class="pain-scale">
            <div class="ps-faces">
              @for (face of painFaces; track face.score) {
                <div class="ps-face" [class.active]="douleur() >= face.score && douleur() < face.score + 2.5" (click)="douleur.set(face.score)">
                  <span class="face-emoji">{{ face.emoji }}</span>
                  <span class="face-range">{{ face.label }}</span>
                </div>
              }
            </div>
            <input type="range" min="0" max="10" step="1" [(ngModel)]="douleur" class="pain-slider" />
            <div class="pain-score">{{ douleur() }} / 10</div>
          </div>
        </div>

        <!-- Section 4: Orientation -->
        <div class="tf-card">
          <h3 class="tf-card-title"><mat-icon>directions</mat-icon> Orientation & Niveau d'urgence</h3>
          <div class="orientation-grid">
            <div class="of-field">
              <label>Niveau d'urgence (suggéré)</label>
              <div class="urgence-suggest" [class]="'u-' + suggestedUrgence().toLowerCase()">{{ urgenceLabel(suggestedUrgence()) }}</div>
            </div>
            <div class="of-field">
              <label>Niveau confirmé</label>
              <select [(ngModel)]="confirmedUrgence" class="field-select">
                <option value="CRITIQUE">CRITIQUE</option>
                <option value="URGENT">Urgent</option>
                <option value="SEMI_URGENT">Semi-urgent</option>
                <option value="NON_URGENT">Non urgent</option>
                <option value="NORMAL">Normal</option>
              </select>
            </div>
            <div class="of-field full">
              <label>Service d'orientation</label>
              <select [(ngModel)]="orientationService" class="field-select">
                <option value="">Sélectionner...</option>
                <option value="urgences">Urgences médicochirurgicales</option>
                <option value="cardio">Cardiologie</option>
                <option value="medecine">Médecine générale</option>
                <option value="chirurgie">Chirurgie</option>
                <option value="pediatrie">Pédiatrie</option>
              </select>
            </div>
            <div class="of-field full">
              <label>Notes infirmier</label>
              <textarea [(ngModel)]="notes" rows="3" class="field-textarea" placeholder="Observations complémentaires..."></textarea>
            </div>
          </div>
          <div class="tf-footer">
            <button class="btn-cancel" routerLink="/symptomes">Annuler</button>
            <button class="btn-submit" (click)="submit()">
              <mat-icon>check_circle</mat-icon> Valider le triage
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tf-page { padding: var(--space-6); }
    .tf-header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-5); }
    .btn-back { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 6px; cursor: pointer; display: flex; }
    .tf-title { font-size: 20px; font-weight: 700; margin: 0; }
    .tf-sub { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; }
    .patient-search-bar { position: relative; display: flex; align-items: center; gap: var(--space-3); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-5); box-shadow: var(--shadow-md); mat-icon { color: var(--color-primary); } input { border: none; background: transparent; outline: none; flex: 1; font-size: 14px; } }
    .ps-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); z-index: 100; list-style: none; padding: 0; margin: 4px 0 0; li { padding: 10px var(--space-4); cursor: pointer; font-size: 13px; &:hover { background: rgba(0,188,212,0.05); } } }
    .tf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); }
    .tf-card { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-md); }
    .tf-card-title { display: flex; align-items: center; gap: var(--space-2); font-size: 14px; font-weight: 700; color: var(--color-text); margin: 0 0 var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-border); mat-icon { color: var(--color-primary); font-size: 18px; } }
    .vitals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
    .vital-field { display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-3); border-radius: var(--radius-md); background: var(--color-background); border: 1px solid var(--color-border); transition: border-color 0.2s;
      mat-icon { color: var(--color-primary); margin-top: 4px; }
      .vf-bmi-label { font-size: 16px; font-weight: 700; color: var(--color-primary); min-width: 24px; }
      &.warn { border-color: #FF9800; background: rgba(255,152,0,0.05); }
      &.crit { border-color: #E53935; background: rgba(229,57,53,0.05); }
    }
    .vf-inputs { flex: 1; }
    .vf-inputs label { font-size: 11px; font-weight: 600; color: var(--color-text-muted); display: block; margin-bottom: 4px; }
    .vf-row { display: flex; align-items: center; gap: 4px;
      input { width: 60px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 4px 6px; font-size: 13px; text-align: center; background: var(--color-surface); &:focus { outline: none; border-color: var(--color-primary); } }
    }
    .vf-unit { font-size: 11px; color: var(--color-text-muted); }
    .bmi-val { font-size: 18px; font-weight: 700; color: var(--color-text); }
    .symp-shortcuts { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-3); }
    .symp-btn { padding: 5px 12px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: transparent; font-size: 12px; cursor: pointer; color: var(--color-text-muted); transition: all 0.15s; &.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); } }
    .symp-input-wrap { display: flex; gap: var(--space-2); margin-bottom: var(--space-3); input { flex: 1; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 8px var(--space-3); font-size: 13px; background: var(--color-background); &:focus { outline: none; border-color: var(--color-primary); } } button { background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); padding: 8px; cursor: pointer; display: flex; mat-icon { font-size: 18px; } } }
    .symp-chips { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .symp-chip { background: rgba(0,188,212,0.1); color: var(--color-primary); border-radius: var(--radius-full); padding: 3px 10px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 4px; button { background: transparent; border: none; cursor: pointer; color: inherit; font-size: 14px; padding: 0; } }
    .pain-scale { display: flex; flex-direction: column; gap: var(--space-3); align-items: center; }
    .ps-faces { display: flex; gap: var(--space-3); }
    .ps-face { display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; opacity: 0.5; transition: opacity 0.2s; &.active { opacity: 1; } }
    .face-emoji { font-size: 28px; }
    .face-range { font-size: 10px; color: var(--color-text-muted); }
    .pain-slider { width: 100%; accent-color: var(--color-primary); }
    .pain-score { font-size: 28px; font-weight: 700; color: var(--color-text); }
    .orientation-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
    .of-field { display: flex; flex-direction: column; gap: var(--space-2); &.full { grid-column: 1 / -1; } label { font-size: 12px; font-weight: 600; color: var(--color-text-muted); } }
    .urgence-suggest { padding: 10px var(--space-3); border-radius: var(--radius-md); font-weight: 700; font-size: 14px; text-align: center;
      &.u-critique { background: rgba(229,57,53,0.1); color: #C62828; }
      &.u-urgent { background: rgba(255,152,0,0.1); color: #E65100; }
      &.u-normal { background: rgba(76,175,80,0.1); color: #2E7D32; }
      &.u-semi_urgent { background: rgba(255,193,7,0.1); color: #F57F17; }
    }
    .field-select, .field-textarea { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px var(--space-3); font-size: 13px; background: var(--color-background); color: var(--color-text); font-family: var(--font-body); resize: vertical; &:focus { outline: none; border-color: var(--color-primary); } }
    .tf-footer { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-5); padding-top: var(--space-4); border-top: 1px solid var(--color-border); grid-column: 1 / -1; }
    .btn-cancel { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 13px; cursor: pointer; color: var(--color-text-muted); }
    .btn-submit { display: inline-flex; align-items: center; gap: var(--space-2); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 14px; font-weight: 600; cursor: pointer; mat-icon { font-size: 18px; } }
  `]
})
export class TriageFormComponent {
  private patientSvc = inject(PatientService);
  private router = inject(Router);

  patientSearch = '';
  sympInput = '';
  confirmedUrgence = 'NORMAL';
  orientationService = '';
  notes = '';

  temp = signal(37.0);
  ta_sys = signal(120);
  ta_dia = signal(80);
  fc = signal(80);
  spo2 = signal(98);
  poids = signal(70);
  douleur = signal(0);
  selectedSymptomes = signal<string[]>([]);
  patientSuggestions = signal<{ id: number; fullName: string }[]>([]);

  bmi = computed(() => {
    const taille = 1.70;
    return (this.poids() / (taille * taille)).toFixed(1);
  });

  suggestedUrgence = computed((): NiveauUrgence => {
    if (this.spo2() < 90 || this.fc() > 130) return 'CRITIQUE';
    if (this.spo2() < 94 || this.ta_sys() > 160 || this.temp() > 39.5) return 'URGENT';
    if (this.douleur() >= 7) return 'URGENT';
    if (this.douleur() >= 5 || this.temp() > 38.5) return 'SEMI_URGENT';
    return 'NORMAL';
  });

  symptomShortcuts = ['Fièvre', 'Douleur thoracique', 'Dyspnée', 'Céphalée', 'Nausées', 'Vomissements', 'Diarrhée', 'Douleur abdominale', 'Vertiges', 'Palpitations', 'Perte de conscience'];
  painFaces = [
    { score: 0, emoji: '😊', label: '0–2' }, { score: 3, emoji: '😐', label: '3–4' },
    { score: 5, emoji: '😟', label: '5–6' }, { score: 7, emoji: '😣', label: '7–8' }, { score: 9, emoji: '😭', label: '9–10' }
  ];

  async filterPatients(): Promise<void> {
    const q = this.patientSearch.toLowerCase();
    if (!q) { this.patientSuggestions.set([]); return; }

    const patients = await firstValueFrom(this.patientSvc.search(q));
    this.patientSuggestions.set(
      patients.slice(0, 5).map(p => ({
        id: p.id,
        fullName: [p.first_name, p.name].filter(Boolean).join(' ').trim() || `Patient #${p.id}`
      }))
    );
  }

  selectPatient(p: { id: number; fullName: string }): void {
    this.patientSearch = p.fullName;
    this.patientSuggestions.set([]);
  }

  toggleSymptom(s: string): void {
    this.selectedSymptomes.update(arr => arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s]);
  }

  addCustomSymptom(): void {
    if (this.sympInput.trim()) {
      this.selectedSymptomes.update(arr => [...arr, this.sympInput.trim()]);
      this.sympInput = '';
    }
  }

  removeSymptom(s: string): void { this.selectedSymptomes.update(arr => arr.filter(x => x !== s)); }

  urgenceLabel(n: NiveauUrgence): string {
    const m: Record<NiveauUrgence, string> = { CRITIQUE: '🔴 CRITIQUE', URGENT: '🟠 Urgent', SEMI_URGENT: '🟡 Semi-urgent', NON_URGENT: '🔵 Non urgent', NORMAL: '🟢 Normal' };
    return m[n];
  }

  submit(): void { this.router.navigate(['/symptomes']); }
}
