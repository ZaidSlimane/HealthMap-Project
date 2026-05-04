import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-rapports-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Centre de rapports</h1>
        <p class="page-sub">Génération et export des rapports médicaux et administratifs</p>
      </div>

      <div class="reports-grid">
        @for (r of reportCards; track r.id) {
          <div class="report-card" [routerLink]="r.route">
            <div class="rc-icon" [class]="'rc-icon-' + r.color">
              <mat-icon>{{ r.icon }}</mat-icon>
            </div>
            <div class="rc-body">
              <h3 class="rc-title">{{ r.title }}</h3>
              <p class="rc-desc">{{ r.description }}</p>
              <span class="rc-last">Dernière génération: {{ r.lastGenerated }}</span>
            </div>
            <div class="rc-footer">
              <button class="rc-btn" [routerLink]="r.route"><mat-icon>assessment</mat-icon> Générer</button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: var(--space-6); }
    .page-header { margin-bottom: var(--space-6); }
    .page-title { font-size: 22px; font-weight: 700; margin: 0; }
    .page-sub { font-size: 13px; color: var(--color-text-muted); margin: 4px 0 0; }
    .reports-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-5); }
    .report-card { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-md); display: flex; flex-direction: column; gap: var(--space-4); cursor: pointer; border: 1px solid var(--color-border); transition: box-shadow 0.2s, transform 0.2s; &:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); } }
    .rc-icon { width: 56px; height: 56px; border-radius: var(--radius-xl); display: flex; align-items: center; justify-content: center; mat-icon { font-size: 26px; }
      &.rc-icon-teal { background: rgba(0,188,212,0.12); color: var(--color-primary); }
      &.rc-icon-purple { background: rgba(156,39,176,0.12); color: #7B1FA2; }
      &.rc-icon-orange { background: rgba(255,152,0,0.12); color: #E65100; }
      &.rc-icon-blue { background: rgba(33,150,243,0.12); color: #1565C0; }
    }
    .rc-body { flex: 1; }
    .rc-title { font-size: 17px; font-weight: 700; margin: 0 0 var(--space-2); color: var(--color-text); }
    .rc-desc { font-size: 13px; color: var(--color-text-muted); margin: 0 0 var(--space-2); line-height: 1.6; }
    .rc-last { font-size: 11px; color: var(--color-text-muted); font-style: italic; }
    .rc-footer { border-top: 1px solid var(--color-border); padding-top: var(--space-4); }
    .rc-btn { display: inline-flex; align-items: center; gap: var(--space-2); background: transparent; border: 1px solid var(--color-primary); color: var(--color-primary); border-radius: var(--radius-md); padding: 8px var(--space-4); font-size: 13px; font-weight: 600; cursor: pointer; mat-icon { font-size: 16px; } &:hover { background: var(--color-primary); color: #fff; } }
  `]
})
export class RapportsDashboardComponent {
  reportCards = [
    { id: 'medical', icon: 'assignment', title: 'Rapport Médical', description: 'Consultations, diagnostics, hospitalisations et sorties. Statistiques par service et médecin.', lastGenerated: 'Aujourd\'hui, 08:00', route: 'medical', color: 'teal' },
    { id: 'pharmacie', icon: 'medication', title: 'Rapport Pharmacie', description: 'Dispensations médicamenteuses, consommation et stocks. Analyse par produit et service.', lastGenerated: 'Hier, 23:00', route: 'medical', color: 'purple' },
    { id: 'bde', icon: 'bar_chart', title: 'Rapport BDE (Épidémiologie)', description: 'Statistiques CIM-10, prévalence des maladies, tendances épidémiologiques et alertes sanitaires.', lastGenerated: 'Il y a 3 jours', route: 'bde', color: 'orange' },
    { id: 'activite', icon: 'trending_up', title: 'Rapport d\'Activité', description: 'Admissions, passages aux urgences, taux d\'occupation des lits et durée moyenne de séjour.', lastGenerated: 'Il y a 1 semaine', route: 'medical', color: 'blue' },
  ];
}
