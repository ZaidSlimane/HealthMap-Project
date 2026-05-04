import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div class="dialog-overlay" (click)="onDismiss()">
        <div class="dialog-card" (click)="$event.stopPropagation()">
          <div class="dialog-icon" [class]="'di-' + variant()">
            <mat-icon>{{ iconForVariant() }}</mat-icon>
          </div>
          <div class="dialog-body">
            <h3 class="dialog-title">{{ title() }}</h3>
            <p class="dialog-msg">{{ message() }}</p>
          </div>
          <div class="dialog-actions">
            <button class="btn-cancel" (click)="onDismiss()">{{ cancelLabel() }}</button>
            <button class="btn-confirm" [class]="'bc-' + variant()" (click)="onConfirm()">{{ confirmLabel() }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .dialog-card { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-6); max-width: 440px; width: 90%; box-shadow: var(--shadow-xl); animation: scaleIn 0.2s ease-out; display: flex; flex-direction: column; gap: var(--space-4); }
    @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .dialog-icon { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; mat-icon { font-size: 28px; }
      &.di-danger { background: rgba(229,57,53,0.1); color: #C62828; }
      &.di-warning { background: rgba(255,152,0,0.1); color: #E65100; }
      &.di-info { background: rgba(0,188,212,0.1); color: var(--color-primary); }
    }
    .dialog-body { text-align: center; }
    .dialog-title { font-size: 18px; font-weight: 700; margin: 0 0 var(--space-2); color: var(--color-text); }
    .dialog-msg { font-size: 14px; color: var(--color-text-muted); margin: 0; line-height: 1.7; }
    .dialog-actions { display: flex; gap: var(--space-3); justify-content: center; }
    .btn-cancel { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 14px; cursor: pointer; color: var(--color-text-muted); }
    .btn-confirm { border: none; border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 14px; font-weight: 700; cursor: pointer;
      &.bc-danger { background: #E53935; color: #fff; &:hover { background: #C62828; } }
      &.bc-warning { background: #FF9800; color: #fff; &:hover { background: #E65100; } }
      &.bc-info { background: var(--color-primary); color: #fff; &:hover { background: var(--color-primary-hover); } }
    }
  `]
})
export class ConfirmationDialogComponent {
  visible = input(false);
  title = input('Confirmer l\'action');
  message = input('Êtes-vous sûr de vouloir effectuer cette action ?');
  confirmLabel = input('Confirmer');
  cancelLabel = input('Annuler');
  variant = input<'danger' | 'warning' | 'info'>('danger');

  confirmed = output<void>();
  dismissed = output<void>();

  iconForVariant(): string {
    return { danger: 'delete_forever', warning: 'warning', info: 'info' }[this.variant()];
  }

  onConfirm(): void { this.confirmed.emit(); }
  onDismiss(): void { this.dismissed.emit(); }
}
