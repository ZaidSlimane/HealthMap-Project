import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { ChefApiService, Box } from '../chef.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-box-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hm-page-header
      title="Gestion des Boxes"
      subtitle="Liste des boxes de consultation du service"
      icon="meeting_room">
      <a routerLink="/chef/boxes/new" class="btn-create">
        <span class="material-icons">add</span>
        Créer une box
      </a>
    </hm-page-header>

    @if (errorMessage()) {
      <div class="error-banner">
        <span class="material-icons">error</span>
        {{ errorMessage() }}
      </div>
    }

    @if (loading()) {
      <hm-spinner label="Chargement des boxes..." />
    } @else {
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Médecin assigné</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (box of boxes(); track box.id) {
              <tr>
                <td class="cell-name">{{ box.label_fr || box.label_ar || box.name }}</td>
                <td>{{ box.assigned_doctor?.name || '—' }}</td>
                <td>
                  <span class="badge" [class.badge-active]="box.is_active" [class.badge-inactive]="!box.is_active">
                    {{ box.is_active ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td class="cell-actions">
                  <a [routerLink]="'/chef/boxes/' + box.id + '/edit'" class="btn-action btn-edit" title="Modifier">
                    <span class="material-icons">edit</span>
                  </a>
                  <button (click)="onDelete(box)" class="btn-action btn-delete" title="Supprimer">
                    <span class="material-icons">delete</span>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="empty-state">Aucune box trouvée</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    .btn-create {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      border-radius: var(--radius-md, 10px);
      background: var(--color-primary, #00BCD4);
      color: #fff;
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      transition: background 0.2s ease;
    }

    .btn-create:hover {
      background: var(--color-primary-dark, #0097A7);
    }

    .btn-create .material-icons {
      font-size: 18px;
    }

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

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--color-text-muted, #64748b);
      font-size: 14px;
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

    .badge-active {
      background: #dcfce7;
      color: #16a34a;
    }

    .badge-inactive {
      background: #f1f5f9;
      color: #64748b;
    }

    .cell-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm, 6px);
      border: 1px solid var(--color-border, #e2e8f0);
      background: var(--color-surface, #fff);
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      color: var(--color-text-muted, #64748b);
    }

    .btn-action .material-icons {
      font-size: 16px;
    }

    .btn-edit:hover {
      border-color: var(--color-primary, #00BCD4);
      color: var(--color-primary, #00BCD4);
      background: rgba(0, 188, 212, 0.08);
    }

    .btn-delete:hover {
      border-color: #dc2626;
      color: #dc2626;
      background: #fef2f2;
    }

    .empty-state {
      text-align: center;
      padding: 40px 16px;
      color: var(--color-text-muted, #64748b);
    }
  `]
})
export class BoxListComponent implements OnInit {
  private readonly chefApi = inject(ChefApiService);
  private readonly router = inject(Router);

  readonly boxes = signal<Box[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.loadBoxes();
  }

  onDelete(box: Box): void {
    const confirmed = window.confirm(`Supprimer la box "${box.label_ar}" ?`);
    if (!confirmed) return;

    this.errorMessage.set('');
    this.chefApi.deleteBox(box.id).subscribe({
      next: () => {
        this.boxes.update(current => current.filter(b => b.id !== box.id));
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 422) {
          this.errorMessage.set(err.error?.message || 'Impossible de supprimer : la box a des affectations actives.');
        } else {
          this.errorMessage.set('Une erreur est survenue lors de la suppression.');
        }
      }
    });
  }

  private loadBoxes(): void {
    this.loading.set(true);
    this.chefApi.getBoxes().subscribe({
      next: (response) => {
        this.boxes.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erreur lors du chargement des boxes.');
        this.loading.set(false);
      }
    });
  }
}
