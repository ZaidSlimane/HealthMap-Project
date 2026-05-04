import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-print-button',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button class="print-btn" [class]="'pb-' + variant()" (click)="print()">
      <mat-icon>print</mat-icon>
      {{ label() }}
    </button>
  `,
  styles: [`
    .print-btn { display: inline-flex; align-items: center; gap: var(--space-2); border-radius: var(--radius-md); padding: 8px var(--space-4); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; mat-icon { font-size: 18px; }
      &.pb-primary { background: var(--color-primary); color: #fff; border: none; &:hover { background: var(--color-primary-hover); } }
      &.pb-outline { background: transparent; border: 1px solid var(--color-border); color: var(--color-text-muted); &:hover { border-color: var(--color-primary); color: var(--color-primary); } }
      &.pb-ghost { background: transparent; border: none; color: var(--color-text-muted); padding: 6px; &:hover { color: var(--color-primary); } }
    }
  `]
})
export class PrintButtonComponent {
  variant = input<'primary' | 'outline' | 'ghost'>('outline');
  label = input('Imprimer');

  print(): void { window.print(); }
}
