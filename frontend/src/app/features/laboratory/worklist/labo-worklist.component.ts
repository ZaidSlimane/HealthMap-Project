import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { LaboService } from '../services/labo.service';

@Component({
  selector: 'app-labo-worklist',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hm-page-header
      title="Worklist Laboratoire"
      subtitle="Liste des demandes d'analyses biologiques"
      icon="science">
    </hm-page-header>

    @if (loading()) {
      <hm-spinner label="Chargement du worklist..." />
    } @else if (errorMessage()) {
      <div class="error-banner">
        <span class="material-icons">error</span>
        {{ errorMessage() }}
      </div>
    } @else {
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Analyses</th>
              <th>Urgence</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            @for (item of worklist(); track item.id) {
              <tr>
                <td class="cell-name">{{ item.patient?.nom }} {{ item.patient?.prenom }}</td>
                <td>{{ getAnalysesSummary(item) }}</td>
                <td>
                  <span class="badge" [class.badge-urgent]="item.urgency === 'urgente'" [class.badge-normal]="item.urgency === 'normale'">
                    {{ item.urgency === 'urgente' ? 'Urgente' : 'Normale' }}
                  </span>
                </td>
                <td>{{ item.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>
                  <span class="badge" [class.badge-pending]="item.status === 'pending'" [class.badge-progress]="item.status === 'in_progress'">
                    {{ getStatusLabel(item.status) }}
                  </span>
                </td>
                <td>
                  <button class="btn-saisie" (click)="onSaisie(item.id)">
                    <span class="material-icons">edit_note</span>
                    Saisie
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="empty-state">Aucune demande en attente</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      border-radius: var(--radius-md, 10px);
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      font-size: 14px;
    }

    .error-banner .material-icons {
      font-size: 20px;
    }

    .table-container {
      background: var(--color-surface, #fff);
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--color-border, #e2e8f0);
      overflow: hidden;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      text-align: left;
      padding: 12px 16px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted, #64748b);
      background: var(--color-surface-alt, #f8fafc);
      border-bottom: 1px solid var(--color-border, #e2e8f0);
    }

    .data-table td {
      padding: 12px 16px;
      font-size: 14px;
      color: var(--color-text, #0f172a);
      border-bottom: 1px solid var(--color-border, #e2e8f0);
    }

    .data-table tbody tr:last-child td {
      border-bottom: none;
    }

    .data-table tbody tr:hover {
      background: var(--color-surface-alt, #f8fafc);
    }

    .cell-name {
      font-weight: 500;
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .badge-urgent {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .badge-normal {
      background: #f0fdf4;
      color: #16a34a;
    }

    .badge-pending {
      background: #fffbeb;
      color: #d97706;
    }

    .badge-progress {
      background: #eff6ff;
      color: #2563eb;
    }

    .btn-saisie {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 14px;
      border-radius: var(--radius-sm, 6px);
      border: 1px solid var(--color-primary, #00BCD4);
      background: rgba(0, 188, 212, 0.08);
      color: var(--color-primary, #00BCD4);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-saisie:hover {
      background: var(--color-primary, #00BCD4);
      color: #fff;
    }

    .btn-saisie .material-icons {
      font-size: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 40px 16px;
      color: var(--color-text-muted, #64748b);
    }
  `]
})
export class LaboWorklistComponent implements OnInit {
  private readonly laboService = inject(LaboService);
  private readonly router = inject(Router);

  readonly worklist = signal<any[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.loadWorklist();
  }

  onSaisie(id: number): void {
    this.router.navigate(['/laboratory/requests', id]);
  }

  getAnalysesSummary(item: any): string {
    if (item.items && item.items.length > 0) {
      return item.items.map((i: any) => {
        if (i.type === 'panel') {
          return i.billon?.name || i.labo_billon?.name || 'Bilan';
        }
        return i.analyse?.name || i.labo_analyse?.name || 'Analyse';
      }).filter(Boolean).join(', ');
    }
    return '—';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'En attente';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  }

  private loadWorklist(): void {
    this.loading.set(true);
    this.laboService.getWorklist().subscribe({
      next: (response) => {
        const data = Array.isArray(response) ? response : (response.data || []);
        this.worklist.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erreur lors du chargement du worklist.');
        this.loading.set(false);
      }
    });
  }
}
