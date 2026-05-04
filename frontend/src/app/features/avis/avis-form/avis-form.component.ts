import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PatientService } from '../../../core/services/patient.service';

@Component({
  selector: 'app-avis-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="af-page">
      <div class="af-header">
        <button class="btn-back" routerLink="/avis-externes"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <h1 class="af-title">Nouvelle demande d'avis</h1>
          <p class="af-sub">Demande de consultation spécialisée</p>
        </div>
      </div>

      <div class="af-card">
        <div class="form-grid">
          <div class="form-group">
            <label>Patient *</label>
            <div class="autocomplete-wrap">
              <mat-icon>person_search</mat-icon>
              <input [(ngModel)]="patientSearch" placeholder="Rechercher..." (input)="filterPatients()" />
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
            <label>Type d'avis</label>
            <div class="type-toggle">
              <button type="button" [class.active]="!externe()" (click)="externe.set(false)">Inter-service</button>
              <button type="button" [class.active]="externe()" (click)="externe.set(true)">Externe</button>
            </div>
          </div>

          @if (externe()) {
            <div class="form-group">
              <label>Établissement</label>
              <input type="text" [(ngModel)]="etablissement" placeholder="Nom de l'établissement..." class="field-input" />
            </div>
          }

          <div class="form-group">
            <label>Spécialité *</label>
            <select [(ngModel)]="specialite" class="field-input">
              <option value="">Sélectionner...</option>
              <option value="Cardiologie">Cardiologie</option>
              <option value="Neurologie">Neurologie</option>
              <option value="Orthopédie">Orthopédie</option>
              <option value="Endocrinologie">Endocrinologie</option>
              <option value="Gastro-entérologie">Gastro-entérologie</option>
              <option value="Pneumologie">Pneumologie</option>
              <option value="Rhumatologie">Rhumatologie</option>
            </select>
          </div>

          @if (!externe()) {
            <div class="form-group">
              <label>Médecin consultant</label>
              <select [(ngModel)]="medecinConsultant" class="field-input">
                <option value="">Sélectionner un médecin...</option>
                <option value="Dr. Khelili M">Dr. Khelili M (Cardiologue)</option>
                <option value="Dr. Boussaid F">Dr. Boussaid F (Gynécologue)</option>
                <option value="Dr. Chouchan M">Dr. Chouchan M (Généraliste)</option>
              </select>
            </div>
          }

          <div class="form-group full">
            <label>Motif de la demande *</label>
            <textarea [(ngModel)]="motif" rows="4" class="field-input" placeholder="Décrivez le motif clinique justifiant cette demande d'avis..."></textarea>
          </div>

          <div class="form-group">
            <label>Documents joints</label>
            <div class="dropzone"><mat-icon>attach_file</mat-icon><span>Glisser ou cliquer pour joindre un document</span></div>
          </div>

          <div class="form-group">
            <label>Urgence</label>
            <div class="urgence-toggle">
              <button type="button" [class.active]="urgence()" (click)="urgence.set(true)"><mat-icon>emergency</mat-icon> Urgent</button>
              <button type="button" [class.active]="!urgence()" (click)="urgence.set(false)">Non urgent</button>
            </div>
          </div>
        </div>

        <div class="af-footer">
          <button class="btn-cancel" routerLink="/avis-externes">Annuler</button>
          <button class="btn-submit" (click)="submit()"><mat-icon>send</mat-icon> Envoyer la demande</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .af-page { padding: var(--space-6); max-width: 800px; }
    .af-header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-6); }
    .btn-back { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 6px; cursor: pointer; display: flex; }
    .af-title { font-size: 20px; font-weight: 700; margin: 0; }
    .af-sub { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; }
    .af-card { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-md); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .form-group { display: flex; flex-direction: column; gap: var(--space-2); &.full { grid-column: 1 / -1; } label { font-size: 12px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; } }
    .field-input { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px var(--space-3); font-size: 13px; background: var(--color-background); color: var(--color-text); font-family: var(--font-body); resize: vertical; &:focus { outline: none; border-color: var(--color-primary); } }
    .autocomplete-wrap { display: flex; align-items: center; gap: var(--space-2); background: var(--color-background); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 8px var(--space-3); mat-icon { color: var(--color-text-muted); font-size: 18px; } input { border: none; background: transparent; outline: none; flex: 1; font-size: 13px; } }
    .ac-list { list-style: none; padding: 0; margin: 0; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; li { padding: 10px var(--space-3); cursor: pointer; font-size: 13px; &:hover { background: rgba(0,188,212,0.05); } } }
    .type-toggle { display: flex; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; button { flex: 1; padding: 10px; border: none; background: transparent; font-size: 13px; cursor: pointer; &.active { background: var(--color-primary); color: #fff; } } }
    .urgence-toggle { display: flex; gap: var(--space-2); button { display: inline-flex; align-items: center; gap: 4px; padding: 8px var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--color-border); background: transparent; font-size: 13px; cursor: pointer; mat-icon { font-size: 16px; } &.active:first-child { background: rgba(229,57,53,0.1); border-color: #E53935; color: #C62828; } &.active:last-child { background: rgba(76,175,80,0.1); border-color: #4CAF50; color: #2E7D32; } } }
    .dropzone { border: 2px dashed var(--color-border); border-radius: var(--radius-md); padding: var(--space-5); display: flex; flex-direction: column; align-items: center; gap: var(--space-2); cursor: pointer; color: var(--color-text-muted); &:hover { border-color: var(--color-primary); color: var(--color-primary); } mat-icon { font-size: 28px; } span { font-size: 13px; } }
    .af-footer { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
    .btn-cancel { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 13px; cursor: pointer; color: var(--color-text-muted); }
    .btn-submit { display: inline-flex; align-items: center; gap: var(--space-2); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 14px; font-weight: 600; cursor: pointer; mat-icon { font-size: 16px; } }
  `]
})
export class AvisFormComponent {
  private patientSvc = inject(PatientService);
  private router = inject(Router);

  patientSearch = '';
  etablissement = '';
  specialite = '';
  medecinConsultant = '';
  motif = '';
  externe = signal(false);
  urgence = signal(false);
  patientSuggestions = signal<{ id: number; fullName: string }[]>([]);

  filterPatients(): void {
    const q = this.patientSearch.toLowerCase();
    if (!q) { this.patientSuggestions.set([]); return; }
    this.patientSuggestions.set(this.patientSvc.getPatients().filter(p => p.fullName.toLowerCase().includes(q)).slice(0, 5).map(p => ({ id: p.id, fullName: p.fullName })));
  }

  selectPatient(p: { id: number; fullName: string }): void {
    this.patientSearch = p.fullName;
    this.patientSuggestions.set([]);
  }

  submit(): void { this.router.navigate(['/avis-externes']); }
}
