import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'hm-page-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div class="ph-left">
        <div>
          <h1 class="ph-title">{{ title }}</h1>
          @if (subtitle) {
            <p class="ph-subtitle">{{ subtitle }}</p>
          }
        </div>
      </div>
      <div class="ph-actions">
        <ng-content></ng-content>
      </div>
    </header>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
    }
    .ph-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ph-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
    }
    .ph-subtitle {
      margin: 2px 0 0;
      font-size: 12px;
      color: var(--color-text-muted, #64748b);
    }
    .ph-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  `]
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = '';
}
