import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'hm-spinner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="spinner-wrap" [class.spinner-inline]="inline" [class.spinner-fullscreen]="fullscreen">
      <div class="spinner-ring" [style.width.px]="size" [style.height.px]="size"></div>
      @if (label) {
        <span class="spinner-label">{{ label }}</span>
      }
    </div>
  `,
  styles: [`
    .spinner-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 32px 16px;
    }

    .spinner-inline {
      flex-direction: row;
      padding: 8px;
      gap: 8px;
    }

    .spinner-fullscreen {
      position: fixed;
      inset: 0;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(2px);
      z-index: 9999;
    }

    .spinner-ring {
      border: 3px solid rgba(0, 188, 212, 0.15);
      border-top-color: var(--color-primary, #00BCD4);
      border-radius: 50%;
      animation: spinner-rotate 0.7s linear infinite;
    }

    .spinner-label {
      font-size: 13px;
      color: var(--color-text-muted, #64748b);
      font-weight: 500;
    }

    @keyframes spinner-rotate {
      to { transform: rotate(360deg); }
    }
  `]
})
export class SpinnerComponent {
  @Input() size = 32;
  @Input() label = '';
  @Input() inline = false;
  @Input() fullscreen = false;
}
