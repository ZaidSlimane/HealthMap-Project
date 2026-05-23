import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  effect,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rdv-toast',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div class="rdv-toast" role="alert" aria-live="polite">
        <span class="rdv-toast-message">{{ message() }}</span>
        <button
          class="rdv-toast-undo"
          type="button"
          (click)="onUndo()"
        >
          Annuler
        </button>
      </div>
    }
  `,
  styles: [`
    :host {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      pointer-events: none;
    }

    .rdv-toast {
      display: inline-flex;
      align-items: center;
      gap: 16px;
      background: #16a34a;
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
      font-size: 14px;
      font-weight: 500;
      pointer-events: auto;
      animation: slideUp 0.25s ease-out;
    }

    .rdv-toast-message {
      white-space: nowrap;
    }

    .rdv-toast-undo {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 6px;
      padding: 4px 12px;
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .rdv-toast-undo:hover {
      background: rgba(255, 255, 255, 0.35);
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
})
export class RdvToastComponent implements OnDestroy {
  /** The confirmation message to display (includes patient name and scheduled time) */
  message = input.required<string>();

  /** Controls toast visibility */
  visible = input.required<boolean>();

  /** Emits when the "Annuler" undo button is clicked */
  undo = output<void>();

  /** Emits when the toast disappears (auto-dismiss or after undo) */
  dismissed = output<void>();

  private autoDismissTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const isVisible = this.visible();
      this.clearTimer();

      if (isVisible) {
        this.autoDismissTimer = setTimeout(() => {
          this.dismissed.emit();
        }, 5000);
      }
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  onUndo(): void {
    this.clearTimer();
    this.undo.emit();
    this.dismissed.emit();
  }

  private clearTimer(): void {
    if (this.autoDismissTimer !== null) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
  }
}
