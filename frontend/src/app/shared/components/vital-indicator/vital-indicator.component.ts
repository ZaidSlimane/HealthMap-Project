import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-vital-indicator',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="vital-indicator" [class]="'vi-' + status()">
      <div class="vi-icon-wrap">
        <mat-icon>{{ iconName() }}</mat-icon>
      </div>
      <div class="vi-body">
        <span class="vi-label">{{ label() }}</span>
        <div class="vi-value-row">
          <span class="vi-value">{{ value() }}</span>
          <span class="vi-unit">{{ unit() }}</span>
        </div>
        @if (reference()) {
          <span class="vi-ref">Réf: {{ reference() }}</span>
        }
      </div>
      <div class="vi-status-icon">
        @if (status() === 'critical') { <mat-icon class="pulse">error</mat-icon> }
        @else if (status() === 'warning') { <mat-icon>warning</mat-icon> }
        @else if (status() === 'normal') { <mat-icon>check_circle</mat-icon> }
      </div>
    </div>
  `,
  styles: [`
    .vital-indicator { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-background); transition: all 0.2s;
      &.vi-normal { border-color: rgba(76,175,80,0.3); background: rgba(76,175,80,0.04); }
      &.vi-warning { border-color: rgba(255,152,0,0.4); background: rgba(255,152,0,0.06); }
      &.vi-critical { border-color: rgba(229,57,53,0.5); background: rgba(229,57,53,0.06); animation: pulse-border 1.5s infinite; }
    }
    @keyframes pulse-border { 0%, 100% { border-color: rgba(229,57,53,0.5); } 50% { border-color: rgba(229,57,53,0.9); } }
    .vi-icon-wrap { width: 36px; height: 36px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      .vi-normal & { background: rgba(76,175,80,0.12); color: #2E7D32; }
      .vi-warning & { background: rgba(255,152,0,0.12); color: #E65100; }
      .vi-critical & { background: rgba(229,57,53,0.12); color: #C62828; }
      mat-icon { font-size: 20px; }
    }
    .vi-body { flex: 1; }
    .vi-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; display: block; margin-bottom: 2px;
      .vi-normal & { color: #2E7D32; }
      .vi-warning & { color: #E65100; }
      .vi-critical & { color: #C62828; }
    }
    .vi-value-row { display: flex; align-items: baseline; gap: 4px; }
    .vi-value { font-size: 20px; font-weight: 700; color: var(--color-text); }
    .vi-unit { font-size: 11px; color: var(--color-text-muted); }
    .vi-ref { font-size: 10px; color: var(--color-text-muted); display: block; margin-top: 2px; }
    .vi-status-icon { mat-icon { font-size: 20px; .vi-normal & { color: #4CAF50; } .vi-warning & { color: #FF9800; } .vi-critical & { color: #E53935; } &.pulse { animation: spin 2s linear infinite; } } }
    @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
  `]
})
export class VitalIndicatorComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  unit = input('');
  iconName = input('monitor_heart');
  reference = input<string | null>(null);
  status = input<'normal' | 'warning' | 'critical'>('normal');
}
