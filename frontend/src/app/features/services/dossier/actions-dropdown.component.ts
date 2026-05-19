import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AdmissionStatus = 'pending' | 'active' | 'discharged' | 'cancelled';

export interface ActionMenuItem {
  id: string;
  label: string;
}

export const DOSSIER_ACTIONS: ActionMenuItem[] = [
  { id: 'radio_exam', label: 'Demander un examen radiologique' },
  { id: 'bio_exam', label: 'Demander un bilan biologique' },
  { id: 'request_act', label: 'Demander un acte' },
  { id: 'prescribe_med', label: 'Prescrire un médicament' },
  { id: 'transfer', label: 'Transfert inter-service' },
  { id: 'companion_mgmt', label: 'Gestion des gardes malade' },
  { id: 'file_mgmt', label: 'Gestion Fichier' },
  { id: 'specialist_opinion', label: 'Demander un avis spécialisé' },
  { id: 'discharge', label: 'Sortie médicale' },
];

/**
 * Returns whether the actions dropdown should be visible based on admission status.
 * Only visible when status is "active".
 */
export function isActionsDropdownVisible(status: AdmissionStatus): boolean {
  return status === 'active';
}

@Component({
  selector: 'app-actions-dropdown',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isVisible()) {
      <div class="actions-dropdown-wrapper">
        <button class="actions-trigger" (click)="toggleMenu()">
          <span class="material-icons">more_vert</span>
          Actions
          <span class="material-icons arrow-icon">{{ menuOpen() ? 'expand_less' : 'expand_more' }}</span>
        </button>

        @if (menuOpen()) {
          <ul class="actions-menu">
            @for (action of actions; track action.id) {
              <li class="actions-menu-item" (click)="selectAction(action.id)">
                {{ action.label }}
              </li>
            }
          </ul>
        }
      </div>
    }
  `,
  styles: [`
    .actions-dropdown-wrapper {
      position: relative;
      display: inline-block;
    }

    .actions-trigger {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--color-border, #e2e8f0);
      background: var(--color-surface, #fff);
      color: var(--color-text, #0f172a);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .actions-trigger:hover {
      border-color: var(--color-primary, #00BCD4);
      color: var(--color-primary, #00BCD4);
    }

    .actions-trigger .material-icons {
      font-size: 18px;
    }

    .arrow-icon {
      font-size: 16px !important;
      opacity: 0.7;
    }

    .actions-menu {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      z-index: 100;
      min-width: 260px;
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      padding: 6px 0;
      margin: 0;
      list-style: none;
    }

    .actions-menu-item {
      padding: 10px 16px;
      font-size: 13px;
      color: var(--color-text, #0f172a);
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .actions-menu-item:hover {
      background: var(--color-bg-hover, #f1f5f9);
    }
  `]
})
export class ActionsDropdownComponent {
  readonly admissionStatus = input.required<AdmissionStatus>();
  readonly actionSelected = output<string>();

  readonly menuOpen = signal(false);
  readonly actions = DOSSIER_ACTIONS;

  readonly isVisible = computed(() => isActionsDropdownVisible(this.admissionStatus()));

  toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }

  selectAction(actionId: string): void {
    this.actionSelected.emit(actionId);
    this.menuOpen.set(false);
  }
}
