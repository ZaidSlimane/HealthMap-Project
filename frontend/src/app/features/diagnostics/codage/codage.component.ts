import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MockDataService } from '../../../core/services/mock-data.service';
import { PatientService } from '../../../core/services/patient.service';
import { Consultation } from '../../../core/models/consultation.model';
import { CodeCIM10 } from '../../../core/models/diagnostic.model';

@Component({
  selector: 'app-codage',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="codage-page">
      <div class="codage-header">
        <button class="btn-back" routerLink="/diagnostics"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <h1 class="codage-title">Codage CIM-10</h1>
          <p class="codage-sub">{{ consultation() ? getPatientName(consultation()!.patientId) : '' }}</p>
        </div>
      </div>

      <div class="codage-layout">
        <!-- LEFT: Consultation summary -->
        @if (consultation()) {
          <div class="codage-summary">
            <h3 class="cs-title">Résumé de consultation</h3>
            <div class="cs-field"><label>Patient</label><p>{{ getPatientName(consultation()!.patientId) }}</p></div>
            <div class="cs-field"><label>Date</label><p>{{ consultation()!.dateHeure | date:'dd/MM/yyyy' }}</p></div>
            <div class="cs-field"><label>Médecin</label><p>{{ consultation()!.medecin }}</p></div>
            <div class="cs-field"><label>Diagnostic textuel</label><p class="italic">{{ consultation()!.diagnosticPrincipal || 'Non renseigné' }}</p></div>
          </div>
        }

        <!-- RIGHT: CIM-10 coding workspace -->
        <div class="codage-workspace">
          <h3 class="cw-title">Codes CIM-10</h3>

          <div class="cim-search-bar">
            <mat-icon>search</mat-icon>
            <input [(ngModel)]="searchQuery" placeholder="Rechercher code ou libellé CIM-10..." (input)="onSearch()" />
          </div>

          @if (searchResults().length > 0) {
            <ul class="cim-results">
              @for (r of searchResults(); track r.code) {
                <li (click)="addCode(r)">
                  <span class="cr-code">{{ r.code }}</span>
                  <span class="cr-libelle">{{ r.libelle }}</span>
                  <span class="cr-chapitre">{{ r.chapitre }}</span>
                </li>
              }
            </ul>
          }

          @if (selectedCodes().length > 0) {
            <div class="selected-codes">
              <h4 class="sc-title">Codes sélectionnés</h4>
              @for (code of selectedCodes(); track code.code; let i = $index) {
                <div class="sc-item">
                  <div class="sc-info">
                    <span class="sc-code">{{ code.code }}</span>
                    <span class="sc-libelle">{{ code.libelle }}</span>
                  </div>
                  <div class="sc-actions">
                    @if (i === 0) {
                      <span class="sc-primary">Principal</span>
                    } @else {
                      <button class="sc-primary-btn" (click)="setPrimary(i)">→ Principal</button>
                    }
                    <button class="sc-remove" (click)="removeCode(i)"><mat-icon>close</mat-icon></button>
                  </div>
                </div>
              }
            </div>
          }

          <div class="sortie-section">
            <label class="sortie-label">Type de sortie</label>
            <div class="sortie-options">
              @for (s of sortieOptions; track s.value) {
                <button type="button" class="sortie-btn" [class.active]="selectedSortie() === s.value" (click)="selectedSortie.set(s.value)">{{ s.label }}</button>
              }
            </div>
          </div>

          <div class="codage-footer">
            <button class="btn-cancel" routerLink="/diagnostics">Annuler</button>
            <button class="btn-valider" (click)="valider()" [disabled]="selectedCodes().length === 0">
              <mat-icon>check</mat-icon> Valider le codage
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .codage-page { padding: var(--space-6); }
    .codage-header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-6); }
    .btn-back { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 6px; cursor: pointer; display: flex; }
    .codage-title { font-size: 20px; font-weight: 700; margin: 0; }
    .codage-sub { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; }
    .codage-layout { display: grid; grid-template-columns: 280px 1fr; gap: var(--space-5); align-items: start; }
    .codage-summary { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-md); }
    .cs-title { font-size: 14px; font-weight: 700; margin: 0 0 var(--space-4); color: var(--color-text); }
    .cs-field { margin-bottom: var(--space-3); label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); display: block; margin-bottom: 4px; } p { font-size: 13px; margin: 0; color: var(--color-text); &.italic { font-style: italic; color: var(--color-text-muted); } } }
    .codage-workspace { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-md); }
    .cw-title { font-size: 14px; font-weight: 700; margin: 0 0 var(--space-4); color: var(--color-text); }
    .cim-search-bar { display: flex; align-items: center; gap: var(--space-3); background: var(--color-background); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-3); margin-bottom: var(--space-3); mat-icon { color: var(--color-text-muted); } input { border: none; background: transparent; outline: none; flex: 1; font-size: 13px; } }
    .cim-results { list-style: none; padding: 0; margin: 0 0 var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; max-height: 200px; overflow-y: auto; li { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); cursor: pointer; border-bottom: 1px solid var(--color-border); &:last-child { border-bottom: none; } &:hover { background: rgba(0,188,212,0.05); } } }
    .cr-code { font-family: var(--font-mono); font-weight: 700; color: var(--color-primary); min-width: 60px; }
    .cr-libelle { flex: 1; font-size: 13px; color: var(--color-text); }
    .cr-chapitre { font-size: 11px; color: var(--color-text-muted); }
    .selected-codes { margin-bottom: var(--space-4); }
    .sc-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); margin: 0 0 var(--space-3); }
    .sc-item { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3); background: var(--color-background); border-radius: var(--radius-md); margin-bottom: var(--space-2); border: 1px solid var(--color-border); }
    .sc-info { display: flex; align-items: center; gap: var(--space-3); }
    .sc-code { font-family: var(--font-mono); font-weight: 700; color: var(--color-primary); }
    .sc-libelle { font-size: 13px; color: var(--color-text); }
    .sc-actions { display: flex; align-items: center; gap: var(--space-2); }
    .sc-primary { background: rgba(0,188,212,0.1); color: var(--color-primary); border-radius: var(--radius-full); padding: 2px 8px; font-size: 11px; font-weight: 700; }
    .sc-primary-btn { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-full); padding: 2px 8px; font-size: 11px; cursor: pointer; color: var(--color-text-muted); }
    .sc-remove { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 2px; cursor: pointer; color: var(--color-text-muted); display: flex; mat-icon { font-size: 14px; } &:hover { color: var(--color-urgent); } }
    .sortie-section { margin-bottom: var(--space-5); }
    .sortie-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); display: block; margin-bottom: var(--space-2); }
    .sortie-options { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .sortie-btn { padding: 6px 14px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: transparent; font-size: 12px; cursor: pointer; color: var(--color-text-muted); &.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); } }
    .codage-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
    .btn-cancel { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px var(--space-4); font-size: 13px; cursor: pointer; color: var(--color-text-muted); }
    .btn-valider { display: inline-flex; align-items: center; gap: var(--space-2); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 14px; font-weight: 600; cursor: pointer; mat-icon { font-size: 16px; } &:disabled { opacity: 0.5; cursor: default; } }
  `]
})
export class CodageComponent implements OnInit {
  private mockData = inject(MockDataService);
  private patientSvc = inject(PatientService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  consultation = signal<Consultation | null>(null);
  searchQuery = '';
  searchResults = signal<CodeCIM10[]>([]);
  selectedCodes = signal<CodeCIM10[]>([]);
  selectedSortie = signal<string>('GUERISON');

  sortieOptions = [
    { value: 'GUERISON', label: 'Guérison' }, { value: 'AMELIORATION', label: 'Amélioration' },
    { value: 'TRANSFERT', label: 'Transfert' }, { value: 'DECES', label: 'Décès' }, { value: 'FUGA', label: 'Fugue' }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('consultationId') ?? '';
    this.consultation.set(this.mockData.getConsultation(id) ?? null);
  }

  getPatientName(id: string): string {
    const p = this.patientSvc.getPatient(+id);
    return p ? p.fullName : `Patient #${id}`;
  }

  onSearch(): void {
    this.searchResults.set(this.mockData.searchCIM10(this.searchQuery).slice(0, 8));
  }

  addCode(code: CodeCIM10): void {
    if (!this.selectedCodes().find(c => c.code === code.code)) {
      this.selectedCodes.update(codes => [...codes, code]);
    }
    this.searchQuery = '';
    this.searchResults.set([]);
  }

  removeCode(i: number): void { this.selectedCodes.update(codes => codes.filter((_, idx) => idx !== i)); }

  setPrimary(i: number): void {
    this.selectedCodes.update(codes => {
      const arr = [...codes];
      const [item] = arr.splice(i, 1);
      arr.unshift(item);
      return arr;
    });
  }

  valider(): void { this.router.navigate(['/diagnostics']); }
}
