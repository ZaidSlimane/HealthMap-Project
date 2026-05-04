import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="page-container page-fade-in">
      <h2 class="section-title"><mat-icon>bar_chart</mat-icon> Statistiques et rapports</h2>
      <div class="stats-cards">
        @for (stat of stats; track stat.label) {
          <div class="stat-card card-surface">
            <mat-icon [style.color]="stat.color" style="font-size:40px;width:40px;">{{ stat.icon }}</mat-icon>
            <div>
              <div style="font-size:32px;font-weight:700;">{{ stat.value }}</div>
              <div style="font-size:13px;color:#757575;">{{ stat.label }}</div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`.stats-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
    .stat-card{display:flex;align-items:center;gap:16px;}`]
})
export class StatsComponent {
  stats = [
    { label: 'Admissions (mois)', value: 347, icon: 'person_add', color: '#00BCD4' },
    { label: 'Consultations', value: 1240, icon: 'medical_services', color: '#43A047' },
    { label: 'Radiologies', value: 215, icon: 'biotech', color: '#1E88E5' },
    { label: 'Analyses labo', value: 832, icon: 'science', color: '#FB8C00' },
    { label: 'Décès', value: 4, icon: 'sentiment_very_dissatisfied', color: '#E53935' },
    { label: 'Naissances', value: 12, icon: 'child_care', color: '#43A047' },
  ];
}
