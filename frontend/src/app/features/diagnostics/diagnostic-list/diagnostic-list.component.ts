import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MockDataService, MOCK_CONSULTATIONS } from '../../../core/services/mock-data.service';
import { PatientService } from '../../../core/services/patient.service';

@Component({
  selector: 'app-diagnostic-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Codage Diagnostics CIM-10</h1>
          <p class="page-sub">Codification des diagnostics médicaux selon la classification internationale</p>
        </div>
        <button class="btn-outline" routerLink="sorties"><mat-icon>exit_to_app</mat-icon> Sorties codées</button>
      </div>

      <!-- Section 1: To be coded -->
      @if (nonCodees().length > 0) {
        <div class="alert-banner">
          <mat-icon>warning</mat-icon>
          {{ nonCodees().length }} consultation(s) nécessitent un code diagnostic CIM-10
        </div>
      }

      <div class="dl-section">
        <h2 class="dl-section-title">Consultations sans code CIM-10</h2>
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Médecin</th>
                <th>Diagnostic textuel</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              @for (c of nonCodees(); track c.id) {
                <tr>
                  <td>{{ c.dateHeure | date:'dd/MM/yyyy' }}</td>
                  <td class="td-patient">{{ getPatientName(c.patientId) }}</td>
                  <td>{{ c.medecin }}</td>
                  <td class="td-diag">{{ c.diagnosticPrincipal || '—' }}</td>
                  <td>
                    <button class="btn-code" [routerLink]="['codage', c.id]">
                      <mat-icon>qr_code</mat-icon> Coder
                    </button>
                  </td>
                </tr>
              }
              @empty {
                <tr><td colspan="5" class="empty-row">✅ Toutes les consultations sont codées</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section 2: Already coded -->
      <div class="dl-section">
        <h2 class="dl-section-title">Diagnostics codés récemment</h2>
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Code CIM-10</th>
                <th>Libellé</th>
                <th>Médecin</th>
                <th>Type sortie</th>
              </tr>
            </thead>
            <tbody>
              @for (d of diagnostics(); track d.id) {
                <tr>
                  <td>{{ d.dateEtablissement | date:'dd/MM/yyyy' }}</td>
                  <td class="td-patient">{{ getPatientName(d.patientId) }}</td>
                  <td><span class="cim-code">{{ d.codesCIM10[0]?.code ?? '—' }}</span></td>
                  <td class="td-libelle">{{ d.codesCIM10[0]?.libelle ?? '—' }}</td>
                  <td>{{ d.medecin }}</td>
                  <td><span class="sortie-badge" [class]="'s-' + (d.typeSortie || 'none').toLowerCase()">{{ d.typeSortie ?? '—' }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: var(--space-6); }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5); }
    .page-title { font-size: 22px; font-weight: 700; margin: 0; }
    .page-sub { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; }
    .alert-banner { background: var(--color-urgent-bg); border-left: 4px solid var(--color-urgent); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-5); font-size: 14px; font-weight: 600; color: var(--color-urgent); mat-icon { font-size: 18px; } }
    .dl-section { margin-bottom: var(--space-6); }
    .dl-section-title { font-size: 16px; font-weight: 700; color: var(--color-text); margin: 0 0 var(--space-3); }
    .table-card { background: var(--color-surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; th { padding: var(--space-3) var(--space-4); text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); background: var(--color-background); border-bottom: 1px solid var(--color-border); } td { padding: var(--space-3) var(--space-4); font-size: 13px; border-bottom: 1px solid var(--color-border); } tr:last-child td { border-bottom: none; } }
    .td-patient { font-weight: 600; }
    .td-diag { max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--color-text-muted); font-style: italic; }
    .td-libelle { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cim-code { font-family: var(--font-mono); font-weight: 700; color: var(--color-primary); background: rgba(0,188,212,0.1); padding: 2px 8px; border-radius: var(--radius-sm); }
    .sortie-badge { padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700; &.s-guerison { background: rgba(76,175,80,0.1); color: #2E7D32; } &.s-amelioration { background: rgba(33,150,243,0.1); color: #1565C0; } &.s-transfert { background: rgba(255,152,0,0.1); color: #E65100; } &.s-deces { background: rgba(158,158,158,0.1); color: #424242; } }
    .btn-code { display: inline-flex; align-items: center; gap: 4px; background: rgba(0,188,212,0.1); color: var(--color-primary); border: 1px solid rgba(0,188,212,0.3); border-radius: var(--radius-md); padding: 5px 12px; font-size: 12px; font-weight: 600; cursor: pointer; mat-icon { font-size: 14px; } &:hover { background: var(--color-primary); color: #fff; } }
    .btn-outline { display: inline-flex; align-items: center; gap: var(--space-2); background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px var(--space-4); font-size: 13px; cursor: pointer; mat-icon { font-size: 16px; } }
    .empty-row { text-align: center; color: var(--color-text-muted); padding: var(--space-8) !important; }
  `]
})
export class DiagnosticListComponent {
  private mockData = inject(MockDataService);
  private patientSvc = inject(PatientService);

  nonCodees = computed(() => MOCK_CONSULTATIONS.filter(c => c.statut === 'TERMINEE' && !c.cim10Code));
  diagnostics = computed(() => this.mockData.getDiagnostics());

  getPatientName(id: string): string {
    const p = this.patientSvc.getPatient(+id);
    return p ? p.fullName : `Patient #${id}`;
  }
}
