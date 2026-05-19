import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PatientMovement {
  id: number;
  patient_id: number;
  admission_id: number;
  bed_id: number;
  moved_at: string;
  left_at: string | null;
  reason: string | null;
  bed?: {
    bed_number: string | number;
    room?: {
      name: string;
      unit?: {
        name: string;
      };
    };
  };
  doctor_name?: string;
}

/**
 * Sorts patient movements in ascending chronological order by moved_at date.
 * Returns a new array without mutating the input.
 */
export function sortMovementsAsc(movements: PatientMovement[]): PatientMovement[] {
  return [...movements].sort(
    (a, b) => new Date(a.moved_at).getTime() - new Date(b.moved_at).getTime()
  );
}

@Component({
  selector: 'app-parcours-tab',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (sortedMovements().length === 0) {
      <div class="empty-state">
        <span class="material-icons empty-icon">swap_horiz</span>
        <p class="empty-message">Aucun mouvement enregistré pour cette admission.</p>
      </div>
    } @else {
      <div class="movements-list">
        @for (movement of sortedMovements(); track movement.id) {
          <div class="movement-card">
            <div class="movement-date">
              <span class="material-icons date-icon">schedule</span>
              {{ movement.moved_at | date:'dd/MM/yyyy HH:mm' }}
            </div>
            <div class="movement-details">
              <div class="detail-row">
                <span class="detail-label">Service</span>
                <span class="detail-value">{{ movement.bed?.room?.unit?.name || '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Chambre</span>
                <span class="detail-value">{{ movement.bed?.room?.name || '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Lit</span>
                <span class="detail-value">{{ movement.bed?.bed_number || '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Médecin responsable</span>
                <span class="detail-value">{{ movement.doctor_name || '—' }}</span>
              </div>
            </div>
            @if (movement.reason) {
              <div class="movement-reason">
                <span class="material-icons reason-icon">info_outline</span>
                {{ movement.reason }}
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 48px 20px;
      text-align: center;
    }

    .empty-icon {
      font-size: 40px;
      color: var(--color-text-muted, #64748b);
      opacity: 0.5;
    }

    .empty-message {
      margin: 0;
      font-size: 14px;
      color: var(--color-text-muted, #64748b);
    }

    .movements-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .movement-card {
      padding: 14px 16px;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      background: var(--color-surface, #fff);
      transition: box-shadow 0.2s ease;
    }

    .movement-card:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .movement-date {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--color-primary, #00BCD4);
      margin-bottom: 10px;
    }

    .date-icon {
      font-size: 16px;
    }

    .movement-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    @media (max-width: 600px) {
      .movement-details {
        grid-template-columns: 1fr;
      }
    }

    .detail-row {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .detail-label {
      font-size: 11px;
      color: var(--color-text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .detail-value {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text, #0f172a);
    }

    .movement-reason {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid var(--color-border, #e2e8f0);
      font-size: 12px;
      color: var(--color-text-muted, #64748b);
      font-style: italic;
    }

    .reason-icon {
      font-size: 16px;
      opacity: 0.7;
    }
  `]
})
export class ParcoursTabComponent {
  readonly movements = input<PatientMovement[]>([]);

  readonly sortedMovements = computed(() => sortMovementsAsc(this.movements()));
}
