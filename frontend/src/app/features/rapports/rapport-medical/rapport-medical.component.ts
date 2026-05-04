import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MockDataService } from '../../../core/services/mock-data.service';

@Component({
  selector: 'app-rapport-medical',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <button class="btn-back" routerLink="/rapports"><mat-icon>arrow_back</mat-icon></button>
          <h1 class="page-title">Rapport Médical</h1>
          <p class="page-sub">Analyse des activités médicales</p>
        </div>
        <div class="export-btns">
          <button class="btn-export"><mat-icon>picture_as_pdf</mat-icon> Exporter PDF</button>
          <button class="btn-export"><mat-icon>table_chart</mat-icon> Exporter Excel</button>
        </div>
      </div>

      <div class="filter-bar">
        <select class="filter-select" [(ngModel)]="period">
          <option value="mois">Ce mois</option>
          <option value="trimestre">Trimestre</option>
          <option value="semestre">Semestre</option>
        </select>
        <select class="filter-select" [(ngModel)]="service">
          <option value="">Tous les services</option>
          <option value="medecine">Médecine générale</option>
          <option value="cardiologie">Cardiologie</option>
        </select>
        <select class="filter-select" [(ngModel)]="medecin">
          <option value="">Tous les médecins</option>
          <option value="nour">Dr. Bennaoum Nour</option>
          <option value="khelili">Dr. Khelili M</option>
        </select>
      </div>

      <div class="kpi-row">
        @for (k of kpis; track k.label) {
          <div class="kpi-card">
            <span class="kpi-val">{{ k.value }}</span>
            <span class="kpi-label">{{ k.label }}</span>
          </div>
        }
      </div>

      <div class="charts-grid">
        <div class="chart-card">
          <h3 class="chart-title">Consultations — 7 derniers jours</h3>
          <div class="bar-chart">
            @for (d of dailyData; track d.day) {
              <div class="bc-col">
                <div class="bc-bar" [style.height.%]="(d.count / maxDaily) * 100"></div>
                <span class="bc-label">{{ d.day }}</span>
                <span class="bc-val">{{ d.count }}</span>
              </div>
            }
          </div>
        </div>

        <div class="chart-card">
          <h3 class="chart-title">Top 5 diagnostics CIM-10</h3>
          <div class="horiz-bars">
            @for (d of topDiags; track d.code) {
              <div class="hb-row">
                <span class="hb-code">{{ d.code }}</span>
                <div class="hb-track">
                  <div class="hb-fill" [style.width.%]="(d.count / maxDiag) * 100"></div>
                </div>
                <span class="hb-val">{{ d.count }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: var(--space-6); }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5); }
    .page-title { font-size: 22px; font-weight: 700; margin: 0; display: inline; }
    .page-sub { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; }
    .btn-back { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 6px; cursor: pointer; display: inline-flex; margin-right: var(--space-3); vertical-align: middle; mat-icon { font-size: 20px; } }
    .export-btns { display: flex; gap: var(--space-2); }
    .btn-export { display: inline-flex; align-items: center; gap: var(--space-2); background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 8px var(--space-4); font-size: 12px; cursor: pointer; mat-icon { font-size: 16px; } }
    .filter-bar { display: flex; gap: var(--space-3); margin-bottom: var(--space-5); }
    .filter-select { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 8px var(--space-3); font-size: 13px; background: var(--color-surface); color: var(--color-text); }
    .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); margin-bottom: var(--space-5); }
    .kpi-card { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-5); text-align: center; box-shadow: var(--shadow-md); border-top: 3px solid var(--color-primary); .kpi-val { display: block; font-size: 32px; font-weight: 700; color: var(--color-primary); } .kpi-label { font-size: 13px; color: var(--color-text-muted); } }
    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); }
    .chart-card { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-md); }
    .chart-title { font-size: 14px; font-weight: 700; margin: 0 0 var(--space-5); color: var(--color-text); }
    .bar-chart { display: flex; gap: var(--space-3); align-items: flex-end; height: 120px; }
    .bc-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; height: 100%; justify-content: flex-end; }
    .bc-bar { width: 100%; background: var(--color-primary); border-radius: var(--radius-sm) var(--radius-sm) 0 0; min-height: 4px; transition: height 0.3s; }
    .bc-label { font-size: 10px; color: var(--color-text-muted); }
    .bc-val { font-size: 10px; font-weight: 700; color: var(--color-text); }
    .horiz-bars { display: flex; flex-direction: column; gap: var(--space-3); }
    .hb-row { display: flex; align-items: center; gap: var(--space-3); }
    .hb-code { font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: var(--color-primary); min-width: 50px; }
    .hb-track { flex: 1; height: 10px; background: var(--color-background); border-radius: var(--radius-full); overflow: hidden; }
    .hb-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); }
    .hb-val { font-size: 12px; font-weight: 700; color: var(--color-text); min-width: 24px; text-align: right; }
  `]
})
export class RapportMedicalComponent {
  period = 'mois';
  service = '';
  medecin = '';

  kpis = [
    { label: 'Total consultations', value: '48' },
    { label: 'Taux hospitalisation', value: '12.5%' },
    { label: 'Durée moy. séjour', value: '3.2 j' },
  ];

  dailyData = [
    { day: 'Lun', count: 8 }, { day: 'Mar', count: 12 }, { day: 'Mer', count: 7 },
    { day: 'Jeu', count: 15 }, { day: 'Ven', count: 10 }, { day: 'Sam', count: 5 }, { day: 'Dim', count: 3 }
  ];
  maxDaily = 15;

  topDiags = [
    { code: 'I10', count: 14 }, { code: 'E11.9', count: 11 }, { code: 'J06.9', count: 8 },
    { code: 'M54.5', count: 6 }, { code: 'K29.7', count: 4 }
  ];
  maxDiag = 14;
}
