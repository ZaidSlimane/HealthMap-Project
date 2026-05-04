import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PatientService } from '../../../core/services/patient.service';

@Component({
  selector: 'app-consultation-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cf-page">
      <div class="cf-header">
        <button class="btn-back" routerLink="/consultations">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1 class="cf-title">Nouvelle consultation</h1>
          <p class="cf-sub">Enregistrer une consultation médicale</p>
        </div>
      </div>

      <div class="cf-card">
        <form (ngSubmit)="submit()" #f="ngForm">
          <div class="form-grid">
            <div class="form-group">
              <label>Patient *</label>
              <div class="autocomplete-wrap">
                <mat-icon>person_search</mat-icon>
                <input [(ngModel)]="patientSearch" name="patient"
                       placeholder="Rechercher par nom..."
                       (input)="filterPatients()" autocomplete="off" />
              </div>
              @if (patientSuggestions().length > 0) {
                <ul class="ac-list">
                  @for (p of patientSuggestions(); track p.id) {
                    <li (click)="selectPatient(p)">{{ p.fullName }}</li>
                  }
                </ul>
              }
            </div>

            <div class="form-group">
              <label>Médecin traitant</label>
              <input type="text" [(ngModel)]="medecin" name="medecin" readonly class="readonly-input" />
            </div>

            <div class="form-group">
              <label>Date et heure</label>
              <input type="datetime-local" [(ngModel)]="dateHeure" name="dateHeure" required />
            </div>

            <div class="form-group">
              <label>Service</label>
              <select [(ngModel)]="service" name="service">
                <option value="">Sélectionner...</option>
                <option value="medecine">Médecine générale</option>
                <option value="cardiologie">Cardiologie</option>
                <option value="urgences">Urgences</option>
                <option value="pediatrie">Pédiatrie</option>
                <option value="gynecologie">Gynécologie</option>
              </select>
            </div>

            <div class="form-group full">
              <label>Motif de consultation *</label>
              <textarea [(ngModel)]="motif" name="motif" required rows="3"
                        placeholder="Décrivez le motif principal de consultation..."></textarea>
            </div>

            <div class="form-group">
              <label>Type de visite</label>
              <div class="type-chips">
                @for (t of typeOptions; track t.value) {
                  <button type="button" class="type-chip"
                          [class.active]="typeVisite() === t.value"
                          (click)="typeVisite.set(t.value)">
                    <mat-icon>{{ t.icon }}</mat-icon> {{ t.label }}
                  </button>
                }
              </div>
            </div>
          </div>

          <div class="form-footer">
            <button type="button" class="btn-cancel" routerLink="/consultations">Annuler</button>
            <button type="submit" class="btn-submit" [disabled]="!motif || !patientSearch">
              <mat-icon>play_circle</mat-icon> Commencer la consultation
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .cf-page { padding: var(--space-6); max-width: 800px; }
    .cf-header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-6); }
    .btn-back { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 6px; cursor: pointer; display: flex; }
    .cf-title { font-size: 22px; font-weight: 700; margin: 0; color: var(--color-text); }
    .cf-sub { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; }
    .cf-card { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-md); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .form-group { display: flex; flex-direction: column; gap: var(--space-2);
      &.full { grid-column: 1 / -1; }
      label { font-size: 12px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
      input, select, textarea {
        border: 1px solid var(--color-border); border-radius: var(--radius-md);
        padding: 10px var(--space-3); font-size: 13px; color: var(--color-text);
        background: var(--color-background); font-family: var(--font-body);
        &:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(0,188,212,0.1); }
      }
      .readonly-input { opacity: 0.7; cursor: default; }
    }
    .autocomplete-wrap {
      display: flex; align-items: center; gap: var(--space-2);
      background: var(--color-background); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); padding: 8px var(--space-3);
      mat-icon { color: var(--color-text-muted); font-size: 18px; flex-shrink: 0; }
      input { border: none; background: transparent; outline: none; flex: 1; font-size: 13px; color: var(--color-text); }
    }
    .ac-list { list-style: none; padding: 0; margin: 0; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-md);
      li { padding: 10px var(--space-3); cursor: pointer; font-size: 13px; &:hover { background: rgba(0,188,212,0.06); } }
    }
    .type-chips { display: flex; gap: var(--space-2); flex-wrap: wrap; }
    .type-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 6px 14px; border-radius: var(--radius-full);
      border: 1px solid var(--color-border); background: transparent;
      font-size: 12px; cursor: pointer; color: var(--color-text-muted); transition: all 0.15s;
      mat-icon { font-size: 14px; }
      &.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
    }
    .form-footer { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
    .btn-cancel { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 14px; cursor: pointer; color: var(--color-text-muted); }
    .btn-submit { display: inline-flex; align-items: center; gap: var(--space-2); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 14px; font-weight: 600; cursor: pointer;
      mat-icon { font-size: 18px; }
      &:disabled { opacity: 0.5; cursor: default; }
    }
  `]
})
export class ConsultationFormComponent {
  private patientSvc = inject(PatientService);
  private router = inject(Router);

  patientSearch = '';
  medecin = 'Dr. Bennaoum Nour';
  dateHeure = new Date().toISOString().slice(0, 16);
  service = '';
  motif = '';
  typeVisite = signal<string>('ambulatoire');
  patientSuggestions = signal<{ id: number; fullName: string }[]>([]);

  typeOptions = [
    { value: 'ambulatoire', label: 'Ambulatoire', icon: 'person' },
    { value: 'hospitalise', label: 'Hospitalisé', icon: 'bed' },
    { value: 'urgence', label: 'Urgence', icon: 'emergency' },
  ];

  filterPatients(): void {
    const q = this.patientSearch.toLowerCase();
    if (!q) { this.patientSuggestions.set([]); return; }
    const results = this.patientSvc.getPatients().filter(p => p.fullName.toLowerCase().includes(q)).slice(0, 5);
    this.patientSuggestions.set(results.map(p => ({ id: p.id, fullName: p.fullName })));
  }

  selectPatient(p: { id: number; fullName: string }): void {
    this.patientSearch = p.fullName;
    this.patientSuggestions.set([]);
  }

  submit(): void {
    this.router.navigate(['/consultations']);
  }
}
