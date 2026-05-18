import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'hm-stat-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stat-card" [style.background]="gradient">
      <div class="sc-left">
        <span class="sc-label">{{ label }}</span>
        <span class="sc-value">{{ value }}</span>
      </div>
      <div class="sc-right">
        <span class="material-icons sc-icon">{{ icon }}</span>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 20px;
      border-radius: var(--radius-lg, 14px);
      color: #fff;
      min-width: 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .sc-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .sc-label {
      font-size: 12px;
      font-weight: 500;
      opacity: 0.85;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .sc-value {
      font-size: 28px;
      font-weight: 800;
      line-height: 1;
    }
    .sc-right {
      display: flex;
      align-items: center;
    }
    .sc-icon {
      font-size: 36px;
      opacity: 0.3;
    }
  `]
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: string | number = 0;
  @Input() icon = '';
  @Input() gradient = 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)';
}
