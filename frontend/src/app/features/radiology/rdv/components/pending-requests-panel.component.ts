import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pending-requests-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="pending-panel">
      <p class="pending-panel-placeholder">Demandes en attente</p>
    </aside>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .pending-panel {
      height: 100%;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      padding: 16px;
    }

    .pending-panel-placeholder {
      margin: 0;
      color: #64748b;
      font-size: 14px;
    }
  `],
})
export class PendingRequestsPanelComponent {}
