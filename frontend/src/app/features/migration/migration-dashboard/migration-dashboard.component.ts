import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-migration-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="migration-page">
      <div class="mig-header">
        <div>
          <h1>Migration des données</h1>
          <p>Transfert depuis l'ancien système vers HealthMap</p>
        </div>
        <button class="btn-teal" routerLink="demarrer"><mat-icon>play_arrow</mat-icon> Démarrer une migration</button>
      </div>

      <div class="mig-status">
        <div class="ms-card ms-complete">
          <mat-icon>check_circle</mat-icon>
          <div><strong>Patients</strong><span>2 847 / 2 847</span></div>
          <div class="ms-bar"><div class="msb-fill" style="width:100%"></div></div>
        </div>
        <div class="ms-card ms-progress">
          <mat-icon>pending</mat-icon>
          <div><strong>Dossiers médicaux</strong><span>1 204 / 2 847</span></div>
          <div class="ms-bar"><div class="msb-fill" style="width:42%"></div></div>
        </div>
        <div class="ms-card ms-pending">
          <mat-icon>schedule</mat-icon>
          <div><strong>Ordonnances</strong><span>0 / 5 120</span></div>
          <div class="ms-bar"><div class="msb-fill" style="width:0%"></div></div>
        </div>
      </div>

      <div class="mig-history">
        <h2>Historique des migrations</h2>
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr><th>Date</th><th>Type</th><th>Lignes</th><th>Statut</th><th>Durée</th><th>Lancé par</th></tr>
            </thead>
            <tbody>
              @for (m of history; track m.id) {
                <tr>
                  <td>{{ m.date }}</td>
                  <td>{{ m.type }}</td>
                  <td>{{ m.rows.toLocaleString('fr') }}</td>
                  <td><span class="mig-badge" [class]="'mb-' + m.status">{{ m.status }}</span></td>
                  <td>{{ m.duration }}</td>
                  <td>{{ m.user }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .migration-page { padding: var(--space-6); }
    .mig-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); h1 { font-size: 22px; font-weight: 700; margin: 0; } p { font-size: 13px; color: var(--color-text-muted); margin: 4px 0 0; } }
    .btn-teal { display: inline-flex; align-items: center; gap: var(--space-2); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 13px; font-weight: 600; cursor: pointer; mat-icon { font-size: 18px; } }
    .mig-status { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
    .ms-card { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-md); display: flex; flex-direction: column; gap: var(--space-3); border-top: 4px solid var(--color-border);
      mat-icon { font-size: 32px; }
      strong { display: block; font-size: 15px; font-weight: 700; }
      span { font-size: 13px; color: var(--color-text-muted); }
      &.ms-complete { border-top-color: #4CAF50; mat-icon { color: #4CAF50; } }
      &.ms-progress { border-top-color: var(--color-primary); mat-icon { color: var(--color-primary); } }
      &.ms-pending { border-top-color: var(--color-border-strong); mat-icon { color: var(--color-text-muted); } }
    }
    .ms-bar { height: 8px; background: var(--color-background); border-radius: var(--radius-full); overflow: hidden; }
    .msb-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); transition: width 0.5s; }
    .ms-complete .msb-fill { background: #4CAF50; }
    .mig-history { h2 { font-size: 18px; font-weight: 700; margin: 0 0 var(--space-4); } }
    .table-card { background: var(--color-surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; th { padding: var(--space-3) var(--space-4); text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); background: var(--color-background); border-bottom: 1px solid var(--color-border); } td { padding: var(--space-3) var(--space-4); font-size: 13px; border-bottom: 1px solid var(--color-border); } tr:last-child td { border-bottom: none; } }
    .mig-badge { padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700; &.mb-Terminé { background: rgba(76,175,80,0.1); color: #2E7D32; } &.mb-Partiel { background: rgba(255,152,0,0.1); color: #E65100; } &.mb-Échoué { background: rgba(229,57,53,0.1); color: #C62828; } }
  `]
})
export class MigrationDashboardComponent {
  history = [
    { id: 1, date: '10/04/2025 23:00', type: 'Patients', rows: 2847, status: 'Terminé', duration: '4 min 12s', user: 'admin' },
    { id: 2, date: '09/04/2025 14:30', type: 'Dossiers médicaux', rows: 1204, status: 'Partiel', duration: '12 min 05s', user: 'admin' },
    { id: 3, date: '01/04/2025 08:00', type: 'Test dossiers', rows: 100, status: 'Terminé', duration: '28s', user: 'admin' },
  ];
}
