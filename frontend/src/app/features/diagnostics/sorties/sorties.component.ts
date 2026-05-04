import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MockDataService } from '../../../core/services/mock-data.service';
import { PatientService } from '../../../core/services/patient.service';

@Component({
  selector: 'app-sorties',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <button class="btn-back" routerLink="/diagnostics"><mat-icon>arrow_back</mat-icon></button>
          <h1 class="page-title">Sorties codées</h1>
          <p class="page-sub">Tableau des diagnostics de sortie codifiés CIM-10</p>
        </div>
        <button class="btn-export"><mat-icon>download</mat-icon> Exporter CSV</button>
      </div>

      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date sortie</th>
              <th>Diagnostic principal (CIM-10)</th>
              <th>Type sortie</th>
              <th>Médecin</th>
            </tr>
          </thead>
          <tbody>
            @for (d of diagnostics(); track d.id) {
              <tr>
                <td class="td-patient">{{ getPatientName(d.patientId) }}</td>
                <td>{{ d.dateEtablissement | date:'dd/MM/yyyy' }}</td>
                <td>
                  @if (d.codesCIM10.length > 0) {
                    <span class="cim-code">{{ d.codesCIM10[0].code }}</span>
                    <span class="cim-libelle">{{ d.codesCIM10[0].libelle }}</span>
                  }
                </td>
                <td><span class="sortie-badge" [class]="'s-' + (d.typeSortie || 'none').toLowerCase()">{{ d.typeSortie ?? '—' }}</span></td>
                <td>{{ d.medecin }}</td>
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
    .page-title { font-size: 22px; font-weight: 700; margin: 0; display: inline; }
    .page-sub { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; }
    .btn-back { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 6px; cursor: pointer; display: inline-flex; margin-right: var(--space-3); vertical-align: middle; mat-icon { font-size: 20px; } }
    .btn-export { display: inline-flex; align-items: center; gap: var(--space-2); background: transparent; border: 1px solid var(--color-primary); color: var(--color-primary); border-radius: var(--radius-md); padding: 10px var(--space-4); font-size: 13px; font-weight: 600; cursor: pointer; mat-icon { font-size: 16px; } }
    .table-card { background: var(--color-surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; th { padding: var(--space-3) var(--space-4); text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); background: var(--color-background); border-bottom: 1px solid var(--color-border); } td { padding: var(--space-3) var(--space-4); font-size: 13px; border-bottom: 1px solid var(--color-border); } tr:last-child td { border-bottom: none; } }
    .td-patient { font-weight: 600; }
    .cim-code { font-family: var(--font-mono); font-weight: 700; color: var(--color-primary); background: rgba(0,188,212,0.1); padding: 2px 8px; border-radius: var(--radius-sm); margin-right: var(--space-2); }
    .cim-libelle { font-size: 12px; color: var(--color-text-muted); }
    .sortie-badge { padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700; &.s-guerison { background: rgba(76,175,80,0.1); color: #2E7D32; } &.s-amelioration { background: rgba(33,150,243,0.1); color: #1565C0; } &.s-transfert { background: rgba(255,152,0,0.1); color: #E65100; } }
  `]
})
export class SortiesComponent {
  private mockData = inject(MockDataService);
  private patientSvc = inject(PatientService);

  diagnostics = () => this.mockData.getDiagnostics();

  getPatientName(id: string): string {
    const p = this.patientSvc.getPatient(+id);
    return p ? p.fullName : `Patient #${id}`;
  }
}
