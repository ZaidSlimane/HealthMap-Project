import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MockDataService } from '../../../core/services/mock-data.service';

@Component({
  selector: 'app-borne-historique',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hist-screen">
      <div class="hist-header">
        <button class="btn-back" routerLink="/borne"><mat-icon>arrow_back</mat-icon> Accueil</button>
        <h1>Historique des tickets — Aujourd'hui</h1>
      </div>

      <div class="filter-strip">
        @for (f of filters; track f.value) {
          <button class="filter-btn" [class.active]="activeFilter() === f.value" (click)="activeFilter.set(f.value)">
            {{ f.label }} ({{ count(f.value) }})
          </button>
        }
      </div>

      <div class="table-card">
        <table class="hist-table">
          <thead>
            <tr><th>Ticket N°</th><th>Patient</th><th>Service</th><th>Heure</th><th>Statut</th></tr>
          </thead>
          <tbody>
            @for (t of filteredTickets(); track t.id) {
              <tr class="hist-row">
                <td class="td-num">{{ t.numero }}</td>
                <td>{{ t.patientNom ?? 'Anonyme' }}</td>
                <td>{{ t.service }}</td>
                <td class="td-time">{{ t.dateHeure | date:'HH:mm' }}</td>
                <td><span class="statut-badge" [class]="'s-' + t.statut.toLowerCase()">{{ statutLabel(t.statut) }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .hist-screen { min-height: 100vh; background: #1A1A2E; color: #fff; padding: var(--space-6); }
    .hist-header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-6); h1 { font-size: 22px; font-weight: 600; margin: 0; } }
    .btn-back { display: inline-flex; align-items: center; gap: var(--space-2); background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius-md); padding: 8px var(--space-4); font-size: 13px; color: #fff; cursor: pointer; mat-icon { font-size: 16px; } }
    .filter-strip { display: flex; gap: var(--space-2); margin-bottom: var(--space-5); }
    .filter-btn { padding: 8px var(--space-4); border-radius: var(--radius-full); border: 1px solid rgba(255,255,255,0.2); background: transparent; color: rgba(255,255,255,0.7); font-size: 13px; cursor: pointer; &.active { background: #00BCD4; border-color: #00BCD4; color: #fff; font-weight: 700; } }
    .table-card { background: rgba(255,255,255,0.05); border-radius: var(--radius-xl); overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
    .hist-table { width: 100%; border-collapse: collapse; th { padding: var(--space-3) var(--space-4); text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: rgba(255,255,255,0.5); border-bottom: 1px solid rgba(255,255,255,0.1); } td { padding: var(--space-3) var(--space-4); font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.06); } tr:last-child td { border: none; } }
    .td-num { font-family: var(--font-mono); font-weight: 700; font-size: 16px; color: #00BCD4; }
    .td-time { font-family: var(--font-mono); color: rgba(255,255,255,0.7); }
    .statut-badge { padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700; &.s-en_attente { background: rgba(255,152,0,0.2); color: #FFB74D; } &.s-appele { background: rgba(33,150,243,0.2); color: #64B5F6; } &.s-en_cours { background: rgba(0,188,212,0.2); color: #4DD0E1; } &.s-termine { background: rgba(76,175,80,0.2); color: #81C784; } &.s-absent { background: rgba(158,158,158,0.2); color: #BDBDBD; } }
  `]
})
export class BorneHistoriqueComponent {
  private mockData = inject(MockDataService);
  activeFilter = signal('tous');

  filters = [
    { value: 'tous', label: 'Tous' }, { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'APPELE', label: 'Appelés' }, { value: 'TERMINE', label: 'Terminés' }
  ];

  filteredTickets = computed(() => {
    const all = this.mockData.getTickets();
    if (this.activeFilter() === 'tous') return all;
    return all.filter(t => t.statut === this.activeFilter());
  });

  count(filter: string): number {
    const all = this.mockData.getTickets();
    if (filter === 'tous') return all.length;
    return all.filter(t => t.statut === filter).length;
  }

  statutLabel(s: string): string {
    const m: Record<string, string> = { EN_ATTENTE: 'En attente', APPELE: 'Appelé', EN_COURS: 'En cours', TERMINE: 'Terminé', ABSENT: 'Absent' };
    return m[s] ?? s;
  }
}
