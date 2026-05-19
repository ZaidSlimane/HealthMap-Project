import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TreatmentEntry {
  id: number;
  prescription_date: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  doctor_name: string;
}

/**
 * Sorts treatment entries in reverse-chronological order (most recent first).
 * Entries with the same date preserve their relative order.
 */
export function sortTreatmentsDesc(entries: TreatmentEntry[]): TreatmentEntry[] {
  return [...entries].sort((a, b) => {
    const dateA = new Date(a.prescription_date).getTime();
    const dateB = new Date(b.prescription_date).getTime();
    return dateB - dateA;
  });
}

@Component({
  selector: 'app-traitement-tab',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (sortedTreatments().length === 0) {
      <div class="empty-state">
        <span class="material-icons empty-icon">medication</span>
        <p class="empty-text">Aucun traitement enregistré pour cette admission.</p>
      </div>
    } @else {
      <div class="treatment-timeline">
        @for (entry of sortedTreatments(); track entry.id) {
          <div class="treatment-entry">
            <div class="entry-date">
              {{ entry.prescription_date | date:'dd/MM/yyyy' }}
            </div>
            <div class="entry-details">
              <div class="entry-medication">{{ entry.medication_name }}</div>
              <div class="entry-dosage">{{ entry.dosage }} — {{ entry.frequency }}</div>
              <div class="entry-doctor">
                <span class="material-icons doctor-icon">person</span>
                {{ entry.doctor_name }}
              </div>
            </div>
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
      padding: 48px 24px;
      text-align: center;
    }

    .empty-icon {
      font-size: 48px;
      color: var(--color-text-muted, #94a3b8);
      margin-bottom: 12px;
    }

    .empty-text {
      margin: 0;
      font-size: 14px;
      color: var(--color-text-muted, #64748b);
    }

    .treatment-timeline {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .treatment-entry {
      display: flex;
      gap: 16px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--color-border, #e2e8f0);
      transition: background 0.15s ease;
    }

    .treatment-entry:hover {
      background: var(--color-bg-hover, #f8fafc);
    }

    .treatment-entry:last-child {
      border-bottom: none;
    }

    .entry-date {
      min-width: 90px;
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-muted, #64748b);
      padding-top: 2px;
    }

    .entry-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .entry-medication {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
    }

    .entry-dosage {
      font-size: 13px;
      color: var(--color-text-muted, #64748b);
    }

    .entry-doctor {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--color-text-muted, #94a3b8);
    }

    .doctor-icon {
      font-size: 14px;
    }
  `]
})
export class TraitementTabComponent {
  readonly treatments = input<TreatmentEntry[]>([]);

  readonly sortedTreatments = computed(() => sortTreatmentsDesc(this.treatments()));
}
