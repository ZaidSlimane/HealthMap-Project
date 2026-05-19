import { Component, input, output, signal, computed, ChangeDetectionStrategy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'hm-inline-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (editing()) {
      <input
        #editInput
        class="ie-input"
        type="text"
        [ngModel]="editValue()"
        (ngModelChange)="editValue.set($event)"
        (keydown.enter)="confirm()"
        (keydown.escape)="cancel()"
        (blur)="confirm()"
        [disabled]="loading()"
        [class.ie-loading]="loading()"
      />
    } @else {
      <span
        class="ie-display"
        [class.ie-placeholder]="!value()"
        (click)="enterEditMode()"
        tabindex="0"
        (keydown.enter)="enterEditMode()"
      >
        {{ value() || placeholder() }}
      </span>
    }
  `,
  styles: [`
    :host { display: inline-block; width: 100%; }

    .ie-display {
      display: inline-block;
      width: 100%;
      padding: 6px 8px;
      border-radius: var(--radius-sm, 6px);
      cursor: pointer;
      font-size: 13px;
      color: var(--color-text, #0f172a);
      border: 1px solid transparent;
      transition: border-color 0.15s, background 0.15s;

      &:hover {
        border-color: var(--color-border, #e2e8f0);
        background: var(--color-surface-hover, #f8fafc);
      }

      &.ie-placeholder {
        color: var(--color-text-muted, #94a3b8);
        font-style: italic;
      }
    }

    .ie-input {
      display: block;
      width: 100%;
      padding: 6px 8px;
      border-radius: var(--radius-sm, 6px);
      font-size: 13px;
      color: var(--color-text, #0f172a);
      border: 1px solid var(--color-primary, #00BCD4);
      outline: none;
      background: var(--color-surface, #fff);
      box-shadow: 0 0 0 2px rgba(0, 188, 212, 0.15);
      transition: opacity 0.15s;

      &.ie-loading {
        opacity: 0.6;
        cursor: not-allowed;
      }

      &:disabled {
        pointer-events: none;
      }
    }
  `]
})
export class InlineEditComponent {
  /** Current display value */
  value = input<string>('');

  /** Placeholder text when value is empty */
  placeholder = input<string>('Cliquez pour modifier...');

  /** Whether a save operation is in progress */
  loading = input<boolean>(false);

  /** Emitted when the user confirms the edit (Enter or blur) */
  confirmed = output<string>();

  /** Emitted when the user cancels the edit (Escape) */
  cancelled = output<void>();

  /** Internal editing state */
  readonly editing = signal(false);

  /** Internal edit buffer */
  readonly editValue = signal('');

  @ViewChild('editInput') private editInputRef?: ElementRef<HTMLInputElement>;

  enterEditMode(): void {
    if (this.loading()) return;
    this.editValue.set(this.value());
    this.editing.set(true);
    // Focus the input after Angular renders it
    setTimeout(() => this.editInputRef?.nativeElement?.focus());
  }

  confirm(): void {
    if (!this.editing()) return;
    const newValue = this.editValue().trim();
    this.editing.set(false);

    if (newValue !== this.value()) {
      this.confirmed.emit(newValue);
    }
  }

  cancel(): void {
    this.editing.set(false);
    this.editValue.set(this.value());
    this.cancelled.emit();
  }
}
