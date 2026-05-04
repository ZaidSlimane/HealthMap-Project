import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/mock-data.service';
import { PatientService } from '../../../core/services/patient.service';
import { TypeDocument } from '../../../core/models/ordonnance.model';

@Component({
  selector: 'app-ordonnance-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Ordonnances & Documents médicaux</h1>
          <p class="page-sub">Gestion des prescriptions et certificats</p>
        </div>
        <button class="btn-teal" routerLink="nouvelle/1">
          <mat-icon>add</mat-icon> Nouvelle ordonnance
        </button>
      </div>

      <div class="stats-row">
        <div class="stat-mini"><span class="sm-val">{{ total() }}</span><span class="sm-label">Total ce mois</span></div>
        <div class="stat-mini"><span class="sm-val">{{ byType('ORDONNANCE') }}</span><span class="sm-label">Ordonnances</span></div>
        <div class="stat-mini"><span class="sm-val">{{ byType('CERTIFICAT') }}</span><span class="sm-label">Certificats</span></div>
        <div class="stat-mini"><span class="sm-val">{{ byType('BON_EXAMEN') + byType('BON_RADIO') }}</span><span class="sm-label">Bons examens</span></div>
      </div>

      <div class="filter-bar">
        <select class="filter-select" [(ngModel)]="filterType">
          <option value="">Tous les types</option>
          <option value="ORDONNANCE">Ordonnance</option>
          <option value="CERTIFICAT">Certificat</option>
          <option value="BON_EXAMEN">Bon d'examen</option>
          <option value="BON_RADIO">Bon de radio</option>
          <option value="ARRET_TRAVAIL">Arrêt de travail</option>
        </select>
        <div class="search-wrap">
          <mat-icon>search</mat-icon>
          <input [(ngModel)]="searchText" placeholder="Rechercher patient..." />
        </div>
      </div>

      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th>Médecin</th>
              <th>Type</th>
              <th>Médicaments</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (o of filteredOrdonnances(); track o.id) {
              <tr>
                <td>{{ o.date | date:'dd/MM/yyyy' }}</td>
                <td class="td-patient">{{ getPatientName(o.patientId) }}</td>
                <td>{{ o.medecin }}</td>
                <td><span class="type-badge" [class]="'type-' + o.type.toLowerCase()">{{ typeLabel(o.type) }}</span></td>
                <td>
                  @if (o.medicaments.length > 0) {
                    <span class="med-chip">{{ o.medicaments.length }} médicament(s)</span>
                  } @else {
                    <span class="na">—</span>
                  }
                </td>
                <td>
                  <span class="statut-dot" [class.imprime]="o.imprime">
                    {{ o.imprime ? 'Imprimé' : 'Non imprimé' }}
                  </span>
                </td>
                <td class="td-actions">
                  <button class="action-btn" [routerLink]="['/ordonnances', o.id]" title="Voir">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button class="action-btn" [routerLink]="['/ordonnances', o.id, 'imprimer']" title="Imprimer">
                    <mat-icon>print</mat-icon>
                  </button>
                  <button class="action-btn" title="Renouveler">
                    <mat-icon>refresh</mat-icon>
                  </button>
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="7" class="empty-row">Aucune ordonnance trouvée</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: var(--space-6); }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5); }
    .page-title { font-size: 22px; font-weight: 700; margin: 0; color: var(--color-text); }
    .page-sub { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-5); }
    .stat-mini { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-4); box-shadow: var(--shadow-md); text-align: center;
      .sm-val { display: block; font-size: 28px; font-weight: 700; color: var(--color-primary); }
      .sm-label { font-size: 12px; color: var(--color-text-muted); }
    }
    .filter-bar { display: flex; gap: var(--space-3); margin-bottom: var(--space-4); }
    .filter-select { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 8px var(--space-3); font-size: 13px; background: var(--color-surface); color: var(--color-text); }
    .search-wrap { display: flex; align-items: center; gap: var(--space-2); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 6px var(--space-3); flex: 1; mat-icon { color: var(--color-text-muted); font-size: 18px; } input { border: none; background: transparent; outline: none; flex: 1; font-size: 13px; } }
    .table-card { background: var(--color-surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse;
      th { padding: var(--space-3) var(--space-4); text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); background: var(--color-background); border-bottom: 1px solid var(--color-border); }
      td { padding: var(--space-3) var(--space-4); font-size: 13px; border-bottom: 1px solid var(--color-border); vertical-align: middle; }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: rgba(0,0,0,0.015); }
    }
    .td-patient { font-weight: 600; color: var(--color-text); }
    .type-badge { padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700;
      &.type-ordonnance { background: rgba(0,188,212,0.1); color: var(--color-primary); }
      &.type-certificat { background: rgba(76,175,80,0.1); color: #2E7D32; }
      &.type-bon_examen, &.type-bon_radio { background: rgba(156,39,176,0.1); color: #7B1FA2; }
      &.type-arret_travail { background: rgba(255,152,0,0.1); color: #E65100; }
    }
    .med-chip { background: rgba(0,188,212,0.08); color: var(--color-primary); border-radius: var(--radius-full); padding: 2px 8px; font-size: 11px; font-weight: 600; }
    .statut-dot { font-size: 12px; color: var(--color-text-muted);
      &.imprime { color: #2E7D32; font-weight: 600; }
    }
    .na { color: var(--color-text-muted); }
    .td-actions { display: flex; gap: 4px; }
    .action-btn { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 4px; cursor: pointer; color: var(--color-text-muted); display: flex; &:hover { background: var(--color-background); color: var(--color-primary); } mat-icon { font-size: 16px; } }
    .empty-row { text-align: center; color: var(--color-text-muted); padding: var(--space-8) !important; }
    .btn-teal { display: inline-flex; align-items: center; gap: var(--space-2); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 13px; font-weight: 600; cursor: pointer; mat-icon { font-size: 18px; } }
  `]
})
export class OrdonnanceListComponent {
  private mockData = inject(MockDataService);
  private patientSvc = inject(PatientService);

  searchText = '';
  filterType = '';
  allOrdonnances = this.mockData.getOrdonnances();

  filteredOrdonnances = computed(() => {
    return this.allOrdonnances.filter(o => {
      const matchType = !this.filterType || o.type === this.filterType;
      const name = this.getPatientName(o.patientId).toLowerCase();
      const matchSearch = !this.searchText || name.includes(this.searchText.toLowerCase());
      return matchType && matchSearch;
    });
  });

  total = computed(() => this.allOrdonnances.length);
  byType(t: TypeDocument): number { return this.allOrdonnances.filter(o => o.type === t).length; }

  getPatientName(id: string): string {
    const p = this.patientSvc.getPatient(+id);
    return p ? p.fullName : `Patient #${id}`;
  }

  typeLabel(t: TypeDocument): string {
    const m: Record<TypeDocument, string> = {
      ORDONNANCE: 'Ordonnance', CERTIFICAT: 'Certificat',
      BON_EXAMEN: 'Bon examen', BON_RADIO: 'Bon radio',
      ARRET_TRAVAIL: 'Arrêt travail', EVACUATION: 'Évacuation'
    };
    return m[t] ?? t;
  }
}
