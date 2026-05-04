import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MOCK_CIM10 } from '../../../core/services/mock-data.service';

interface BDEStat {
  code: string;
  libelle: string;
  cas: number;
  pourcentage: number;
  tendance: 'up' | 'down' | 'stable';
}

@Component({
  selector: 'app-rapport-bde',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <button class="btn-back" routerLink="/rapports"><mat-icon>arrow_back</mat-icon></button>
          <h1 class="page-title">Base de Données Épidémiologiques</h1>
          <p class="page-sub">Statistiques CIM-10 et tendances épidémiologiques</p>
        </div>
        <button class="btn-export"><mat-icon>download</mat-icon> Exporter SNDS</button>
      </div>

      <div class="bde-filters">
        <select class="filter-select">
          <option>Ce mois</option><option>Trimestre</option><option>Année</option>
        </select>
        <select class="filter-select">
          <option>Tous âges</option><option>0-17 ans</option><option>18-59 ans</option><option>60+ ans</option>
        </select>
        <select class="filter-select">
          <option>Tous sexes</option><option>Masculin</option><option>Féminin</option>
        </select>
      </div>

      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Code CIM-10</th>
              <th>Libellé</th>
              <th>Nombre de cas</th>
              <th>% du total</th>
              <th>Tendance</th>
            </tr>
          </thead>
          <tbody>
            @for (stat of bdeStats; track stat.code; let i = $index) {
              <tr>
                <td class="td-rank">{{ i + 1 }}</td>
                <td><span class="cim-code">{{ stat.code }}</span></td>
                <td class="td-libelle">{{ stat.libelle }}</td>
                <td>
                  <div class="cas-bar">
                    <div class="cb-fill" [style.width.%]="(stat.cas / maxCas) * 100"></div>
                    <span class="cb-val">{{ stat.cas }}</span>
                  </div>
                </td>
                <td class="td-pct">{{ stat.pourcentage }}%</td>
                <td>
                  <span class="tendance" [class]="'t-' + stat.tendance">
                    <mat-icon>{{ stat.tendance === 'up' ? 'trending_up' : stat.tendance === 'down' ? 'trending_down' : 'trending_flat' }}</mat-icon>
                  </span>
                </td>
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
    .page-title { font-size: 20px; font-weight: 700; margin: 0; display: inline; }
    .page-sub { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; }
    .btn-back { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 6px; cursor: pointer; display: inline-flex; margin-right: var(--space-3); vertical-align: middle; mat-icon { font-size: 20px; } }
    .btn-export { display: inline-flex; align-items: center; gap: var(--space-2); background: transparent; border: 1px solid var(--color-primary); color: var(--color-primary); border-radius: var(--radius-md); padding: 10px var(--space-4); font-size: 13px; font-weight: 600; cursor: pointer; mat-icon { font-size: 16px; } }
    .bde-filters { display: flex; gap: var(--space-3); margin-bottom: var(--space-5); }
    .filter-select { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 8px var(--space-3); font-size: 13px; background: var(--color-surface); color: var(--color-text); }
    .table-card { background: var(--color-surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; th { padding: var(--space-3) var(--space-4); text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); background: var(--color-background); border-bottom: 1px solid var(--color-border); } td { padding: var(--space-3) var(--space-4); font-size: 13px; border-bottom: 1px solid var(--color-border); } tr:last-child td { border-bottom: none; } }
    .td-rank { font-weight: 700; color: var(--color-text-muted); }
    .cim-code { font-family: var(--font-mono); font-weight: 700; color: var(--color-primary); background: rgba(0,188,212,0.1); padding: 2px 8px; border-radius: var(--radius-sm); }
    .td-libelle { max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cas-bar { display: flex; align-items: center; gap: var(--space-3); min-width: 120px; }
    .cb-fill { height: 8px; background: var(--color-primary); border-radius: var(--radius-full); min-width: 4px; }
    .cb-val { font-size: 12px; font-weight: 700; color: var(--color-text); }
    .td-pct { font-weight: 600; color: var(--color-text); }
    .tendance { display: flex; mat-icon { font-size: 20px; } &.t-up { color: #E53935; } &.t-down { color: #4CAF50; } &.t-stable { color: var(--color-text-muted); } }
  `]
})
export class RapportBDEComponent {
  bdeStats: BDEStat[] = [
    { code: 'I10', libelle: 'Hypertension artérielle essentielle', cas: 14, pourcentage: 29.2, tendance: 'up' },
    { code: 'E11.9', libelle: 'Diabète sucré de type 2', cas: 11, pourcentage: 22.9, tendance: 'up' },
    { code: 'J06.9', libelle: 'Infection VRS', cas: 8, pourcentage: 16.7, tendance: 'down' },
    { code: 'M54.5', libelle: 'Lombalgie basse', cas: 6, pourcentage: 12.5, tendance: 'stable' },
    { code: 'K29.7', libelle: 'Gastrite chronique', cas: 4, pourcentage: 8.3, tendance: 'stable' },
    { code: 'N39.0', libelle: 'Infection voies urinaires', cas: 3, pourcentage: 6.3, tendance: 'down' },
    { code: 'R51', libelle: 'Céphalée', cas: 2, pourcentage: 4.2, tendance: 'stable' },
  ];
  maxCas = 14;
}
