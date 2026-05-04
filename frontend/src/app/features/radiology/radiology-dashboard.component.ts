import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-radiology-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="page-container page-fade-in">
      <h2 class="section-title">Tableau de bord — Radiologie</h2>
      <div class="stats-grid">
        <div class="stat-card card-surface" *ngFor="let s of stats">
          <mat-icon [style.color]="s.color">{{ s.icon }}</mat-icon>
          <div>
            <div class="stat-val">{{ s.value }}</div>
            <div class="stat-lbl">{{ s.label }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .stat-card { display: flex; align-items: center; gap: 16px; }
    .stat-card mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .stat-val { font-size: 28px; font-weight: 700; }
    .stat-lbl { font-size: 13px; color: #757575; }
  `]
})
export class RadiologyDashboardComponent {
  stats = [
    { label: 'Demandes du jour', value: 8, icon: 'assignment', color: '#00BCD4' },
    { label: 'En attente', value: 3, icon: 'hourglass_empty', color: '#FB8C00' },
    { label: 'Terminées', value: 5, icon: 'check_circle', color: '#43A047' },
  ];
}
