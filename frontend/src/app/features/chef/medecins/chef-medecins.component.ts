import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { ChefApiService, ServiceDoctor } from '../chef.service';

@Component({
  selector: 'app-chef-medecins',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hm-page-header
      title="Médecins du service"
      subtitle="Liste des médecins affectés au service"
      icon="people">
    </hm-page-header>

    @if (errorMessage()) {
      <div class="error-banner">
        <span class="material-icons">error</span>
        {{ errorMessage() }}
      </div>
    }

    @if (loading()) {
      <hm-spinner label="Chargement des médecins..." />
    } @else {
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Box assignée</th>
              <th>Planning</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            @for (doctor of doctors(); track doctor.id) {
              <tr>
                <td class="cell-name">{{ doctor.name }}</td>
                <td>{{ doctor.assigned_box?.label_fr || doctor.assigned_box?.label_ar || '—' }}</td>
                <td class="cell-schedule">{{ formatSchedule(doctor.schedule_summary) }}</td>
                <td>
                  <span class="badge" [class.badge-active]="doctor.is_active" [class.badge-inactive]="!doctor.is_active">
                    {{ doctor.is_active ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="empty-state">Aucun médecin trouvé</td>
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

    .cell-schedule {
      font-size: 13px;
      color: var(--color-text-muted, #64748b);
      max-width: 280px;
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

    .empty-state {
      text-align: center;
      padding: 40px 16px;
      color: var(--color-text-muted, #64748b);
    }
  `]
})
export class ChefMedecinsComponent implements OnInit {
  private readonly chefApi = inject(ChefApiService);

  readonly doctors = signal<ServiceDoctor[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.loadDoctors();
  }

  formatSchedule(schedule: ServiceDoctor['schedule_summary']): string {
    if (!schedule || schedule.length === 0) return '—';

    return schedule.map(s => {
      const days = s.day_of_week.join(', ');
      return `${days} ${s.start_time}–${s.end_time}`;
    }).join(' | ');
  }

  private loadDoctors(): void {
    this.loading.set(true);
    this.chefApi.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors.set(doctors);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erreur lors du chargement des médecins.');
        this.loading.set(false);
      }
    });
  }
}
