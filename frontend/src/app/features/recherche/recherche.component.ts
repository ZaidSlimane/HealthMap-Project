import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PatientService } from '../../core/services/patient.service';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-recherche',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="recherche-page">
      <div class="rech-hero">
        <h1 class="rech-title">Recherche globale</h1>
        <p class="rech-sub">Patients, consultations, ordonnances, diagnostics</p>
        <div class="rech-input-wrap">
          <mat-icon>search</mat-icon>
          <input [(ngModel)]="query" placeholder="Rechercher dans tout le dossier médical..."
                 (input)="search()" class="rech-input" autofocus />
          @if (query) {
            <button class="clear-btn" (click)="clear()"><mat-icon>close</mat-icon></button>
          }
        </div>
        <div class="scope-filters">
          @for (f of scopes; track f.id) {
            <button class="scope-btn" [class.active]="activeScope() === f.id" (click)="activeScope.set(f.id)">
              <mat-icon>{{ f.icon }}</mat-icon> {{ f.label }}
            </button>
          }
        </div>
      </div>

      @if (query.length >= 2) {
        <div class="results-area">
          @if (patientResults().length > 0 && (activeScope() === 'all' || activeScope() === 'patients')) {
            <div class="results-section">
              <h3 class="rs-title"><mat-icon>person</mat-icon> Patients ({{ patientResults().length }})</h3>
              @for (p of patientResults(); track p.id) {
                <div class="result-card" (click)="navigate('/bde/patients')">
                  <div class="rc-icon rc-patient"><mat-icon>person</mat-icon></div>
                  <div class="rc-content">
                    <strong>{{ p.fullName }}</strong>
                    <span>N° {{ p.admissionNumber }} · {{ p.dob }}</span>
                  </div>
                  <mat-icon class="rc-arrow">chevron_right</mat-icon>
                </div>
              }
            </div>
          }

          @if (consultResults().length > 0 && (activeScope() === 'all' || activeScope() === 'consultations')) {
            <div class="results-section">
              <h3 class="rs-title"><mat-icon>stethoscope</mat-icon> Consultations ({{ consultResults().length }})</h3>
              @for (c of consultResults(); track c.id) {
                <div class="result-card" (click)="navigate('/consultations/' + c.id)">
                  <div class="rc-icon rc-consult"><mat-icon>stethoscope</mat-icon></div>
                  <div class="rc-content">
                    <strong>{{ c.motif }}</strong>
                    <span>{{ c.medecin }} · {{ c.dateHeure | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <mat-icon class="rc-arrow">chevron_right</mat-icon>
                </div>
              }
            </div>
          }

          @if (cimResults().length > 0 && (activeScope() === 'all' || activeScope() === 'cim10')) {
            <div class="results-section">
              <h3 class="rs-title"><mat-icon>local_hospital</mat-icon> Codes CIM-10 ({{ cimResults().length }})</h3>
              @for (c of cimResults().slice(0, 5); track c.code) {
                <div class="result-card" (click)="navigate('/diagnostics')">
                  <div class="rc-icon rc-cim"><mat-icon>qr_code</mat-icon></div>
                  <div class="rc-content">
                    <strong>{{ c.code }}</strong>
                    <span>{{ c.libelle }}</span>
                  </div>
                  <span class="rc-chapter">{{ c.chapitre }}</span>
                </div>
              }
            </div>
          }

          @if (patientResults().length === 0 && consultResults().length === 0 && cimResults().length === 0) {
            <div class="no-results">
              <mat-icon>search_off</mat-icon>
              <h3>Aucun résultat pour "{{ query }}"</h3>
              <p>Essayez avec d'autres termes de recherche</p>
            </div>
          }
        </div>
      } @else if (query.length > 0) {
        <div class="search-hint"><mat-icon>info</mat-icon> Saisissez au moins 2 caractères pour lancer la recherche</div>
      } @else {
        <div class="search-placeholder">
          <div class="sp-shortcuts">
            <h3>Recherches rapides</h3>
            @for (s of shortcuts; track s) {
              <button class="sp-btn" (click)="quickSearch(s)">{{ s }}</button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .recherche-page { padding: var(--space-6); max-width: 800px; }
    .rech-hero { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-md); margin-bottom: var(--space-5); }
    .rech-title { font-size: 28px; font-weight: 700; margin: 0 0 var(--space-2); }
    .rech-sub { font-size: 14px; color: var(--color-text-muted); margin: 0 0 var(--space-4); }
    .rech-input-wrap { display: flex; align-items: center; gap: var(--space-3); background: var(--color-background); border: 2px solid var(--color-primary); border-radius: var(--radius-xl); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-4); mat-icon { color: var(--color-primary); font-size: 22px; } }
    .rech-input { flex: 1; border: none; background: transparent; outline: none; font-size: 16px; color: var(--color-text); }
    .clear-btn { background: transparent; border: none; cursor: pointer; color: var(--color-text-muted); display: flex; mat-icon { font-size: 18px; } }
    .scope-filters { display: flex; gap: var(--space-2); flex-wrap: wrap; }
    .scope-btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: 6px 14px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: transparent; font-size: 12px; cursor: pointer; color: var(--color-text-muted); mat-icon { font-size: 14px; } &.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); } }
    .results-area { display: flex; flex-direction: column; gap: var(--space-5); }
    .results-section { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-4); box-shadow: var(--shadow-md); }
    .rs-title { display: flex; align-items: center; gap: var(--space-2); font-size: 13px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); margin: 0 0 var(--space-3); mat-icon { font-size: 16px; color: var(--color-primary); } }
    .result-card { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border-radius: var(--radius-md); cursor: pointer; border-bottom: 1px solid var(--color-border); &:last-child { border: none; } &:hover { background: var(--color-background); } }
    .rc-icon { width: 36px; height: 36px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; mat-icon { font-size: 18px; } &.rc-patient { background: rgba(0,188,212,0.1); color: var(--color-primary); } &.rc-consult { background: rgba(76,175,80,0.1); color: #2E7D32; } &.rc-cim { background: rgba(156,39,176,0.1); color: #7B1FA2; } }
    .rc-content { flex: 1; strong { display: block; font-size: 14px; font-weight: 600; color: var(--color-text); } span { font-size: 12px; color: var(--color-text-muted); } }
    .rc-arrow, .rc-chapter { color: var(--color-text-muted); font-size: 12px; }
    .no-results { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-10); text-align: center; color: var(--color-text-muted); mat-icon { font-size: 48px; } h3 { margin: 0; color: var(--color-text); } p { margin: 0; font-size: 14px; } }
    .search-hint { display: flex; align-items: center; gap: var(--space-2); color: var(--color-text-muted); font-size: 13px; padding: var(--space-4); mat-icon { font-size: 16px; } }
    .search-placeholder { padding: var(--space-4); }
    .sp-shortcuts h3 { font-size: 14px; font-weight: 700; margin: 0 0 var(--space-3); color: var(--color-text); }
    .sp-btn { margin: 0 var(--space-2) var(--space-2) 0; padding: 6px 14px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-surface); font-size: 13px; cursor: pointer; color: var(--color-text); box-shadow: var(--shadow-sm); &:hover { border-color: var(--color-primary); color: var(--color-primary); } }
  `]
})
export class RechercheComponent {
  private patientSvc = inject(PatientService);
  private mockData = inject(MockDataService);
  private router = inject(Router);

  query = '';
  activeScope = signal<string>('all');

  scopes = [
    { id: 'all', icon: 'apps', label: 'Tout' },
    { id: 'patients', icon: 'person', label: 'Patients' },
    { id: 'consultations', icon: 'stethoscope', label: 'Consultations' },
    { id: 'cim10', icon: 'local_hospital', label: 'CIM-10' },
  ];

  shortcuts = ['Hypertension', 'Diabète', 'Bronchite', 'Grippe', 'Douleur thoracique'];

  patientResults = signal<{ id: number; fullName: string; admissionNumber: number; dob: string }[]>([]);
  consultResults = signal<{ id: string; motif: string; medecin?: string; dateHeure: Date }[]>([]);
  cimResults = signal<{ code: string; libelle: string; chapitre: string }[]>([]);

  search(): void {
    if (this.query.length < 2) {
      this.patientResults.set([]);
      this.consultResults.set([]);
      this.cimResults.set([]);
      return;
    }
    const q = this.query.toLowerCase();

    const patients = this.patientSvc.getPatients();
    this.patientResults.set(
      patients.filter(p => p.fullName.toLowerCase().includes(q) || p.admissionNumber.toString().includes(q)).slice(0, 5)
    );

    const consults = this.mockData.getConsultations();
    this.consultResults.set(
      consults.filter(c => c.motif.toLowerCase().includes(q) || (c.diagnosticPrincipal ?? '').toLowerCase().includes(q)).slice(0, 5)
    );

    const cim = this.mockData.searchCIM10(this.query);
    this.cimResults.set(cim.slice(0, 5));
  }

  clear(): void {
    this.query = '';
    this.patientResults.set([]);
    this.consultResults.set([]);
    this.cimResults.set([]);
  }

  quickSearch(s: string): void { this.query = s; this.search(); }
  navigate(route: string): void { this.router.navigate([route]); }
}
