import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-drop-zone-indicator',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div class="drop-zone-strip">
        <span class="drop-zone-text">↓ Glissez une demande ici pour programmer un RDV</span>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .drop-zone-strip {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px 16px;
      background: #00BCD4;
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      border-radius: var(--radius-sm, 6px);
      animation: fadeIn 0.2s ease-in-out;
    }

    .drop-zone-text {
      letter-spacing: 0.02em;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class DropZoneIndicatorComponent {
  visible = input.required<boolean>();
}
