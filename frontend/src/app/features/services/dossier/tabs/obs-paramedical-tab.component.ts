import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ParamedicalObservation {
  id: number;
  observation_date: string;
  observation_text: string;
  author_name: string;
  type: 'paramedical';
}

/**
 * Returns whether the observation tab should be visible.
 * Visible when there are observations OR the user has a nursing role.
 */
export function isObsTabVisible(observations: ParamedicalObservation[], userRole: string | null): boolean {
  return observations.length > 0 || userRole === 'nurse';
}

@Component({
  selector: 'app-obs-paramedical-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isVisible()) {
      <div class="obs-paramedical-tab">
        <h3 class="tab-title">Observations Paramédicales</h3>

        @if (observations().length === 0) {
          <div class="empty-state">
            <span class="material-icons empty-icon">notes</span>
            <p>Aucune observation paramédicale enregistrée.</p>
          </div>
        } @else {
          <div class="observations-feed">
            @for (obs of observations(); track obs.id) {
              <div class="observation-card">
                <div class="observation-header">
                  <span class="author-name">{{ obs.author_name }}</span>
                  <span class="observation-date">{{ obs.observation_date | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <p class="observation-text">{{ obs.observation_text }}</p>
              </div>
            }
          </div>
        }

        @if (canAddObservation()) {
          <div class="add-observation-area">
            <label class="input-label" for="new-observation">Nouvelle observation</label>
            <textarea
              id="new-observation"
              class="observation-input"
              [(ngModel)]="newObservationText"
              placeholder="Saisir une observation paramédicale..."
              rows="3"
            ></textarea>
            <button
              class="btn-submit"
              [disabled]="!newObservationText().trim()"
              (click)="submitObservation()"
            >
              <span class="material-icons">add</span>
              Ajouter l'observation
            </button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .obs-paramedical-tab {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .tab-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
      margin: 0;
    }

    /* === Empty state === */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 32px 16px;
      text-align: center;
      color: var(--color-text-muted, #64748b);
    }

    .empty-icon {
      font-size: 36px;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
      font-size: 13px;
      font-style: italic;
    }

    /* === Observations feed === */
    .observations-feed {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .observation-card {
      padding: 12px 16px;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      background: var(--color-bg-subtle, #f8fafc);
    }

    .observation-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .author-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
    }

    .observation-date {
      font-size: 12px;
      color: var(--color-text-muted, #64748b);
    }

    .observation-text {
      margin: 0;
      font-size: 13px;
      color: var(--color-text, #0f172a);
      line-height: 1.5;
      white-space: pre-wrap;
    }

    /* === Add observation area === */
    .add-observation-area {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid var(--color-border, #e2e8f0);
    }

    .input-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .observation-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      font-size: 13px;
      font-family: inherit;
      color: var(--color-text, #0f172a);
      resize: vertical;
      transition: border-color 0.2s ease;
    }

    .observation-input:focus {
      outline: none;
      border-color: var(--color-primary, #00BCD4);
    }

    .observation-input::placeholder {
      color: var(--color-text-muted, #94a3b8);
    }

    .btn-submit {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      align-self: flex-start;
      padding: 8px 14px;
      border-radius: var(--radius-md, 10px);
      border: none;
      background: var(--color-primary, #00BCD4);
      color: #fff;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s ease;
    }

    .btn-submit:hover:not(:disabled) {
      opacity: 0.9;
    }

    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-submit .material-icons {
      font-size: 16px;
    }
  `]
})
export class ObsParamedicalTabComponent {
  /** Array of paramedical observations to display */
  readonly observations = input<ParamedicalObservation[]>([]);

  /** Current user role — used to determine if the user can add observations */
  readonly userRole = input<string | null>(null);

  /** Text for the new observation input */
  readonly newObservationText = signal('');

  /** Whether the tab should be visible (data exists or user has nursing role) */
  readonly isVisible = computed(() => isObsTabVisible(this.observations(), this.userRole()));

  /** Whether the user can add new observations (nursing role) */
  readonly canAddObservation = computed(() => this.userRole() === 'nurse');

  submitObservation(): void {
    const text = this.newObservationText().trim();
    if (!text) return;
    // Submission logic will be wired in the integration task (15.x)
    // For now, clear the input after "submit"
    this.newObservationText.set('');
  }
}
