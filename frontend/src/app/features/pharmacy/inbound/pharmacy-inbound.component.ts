import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'hm-pharmacy-inbound',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inbound-page">
      <h2 class="page-title">Approvisionnement</h2>

      <div class="tab-switcher">
        <button class="tab" [class.active]="activeTab() === 'commandes'" (click)="activeTab.set('commandes')">
          Commandes
        </button>
        <button class="tab" [class.active]="activeTab() === 'reception'" (click)="activeTab.set('reception')">
          Réception
        </button>
      </div>

      <div class="workspace">
        @if (activeTab() === 'commandes') {
          <p class="placeholder">Commandes management coming soon...</p>
        } @else {
          <p class="placeholder">Réception management coming soon...</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .inbound-page { max-width: 1200px; }
    .page-title { margin: 0 0 24px; font-size: 22px; font-weight: 700; }
    .tab-switcher {
      display: flex; gap: 4px; padding: 4px;
      background: var(--color-bg, #F1F5F9); border-radius: 8px;
      margin-bottom: 24px; width: fit-content;
    }
    .tab {
      padding: 8px 16px; border: none; background: transparent;
      border-radius: 6px; font-size: 13px; font-weight: 600;
      color: var(--color-text-muted, #64748B); cursor: pointer;
      transition: all 0.15s;
    }
    .tab.active {
      background: var(--color-surface, #fff); color: var(--color-text, #0F172A);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .workspace {
      background: var(--color-surface, #fff); border-radius: 12px;
      border: 1px solid var(--color-border, #E2E8F0);
      padding: 40px; text-align: center;
    }
    .placeholder { color: var(--color-text-muted, #94A3B8); font-style: italic; }
  `],
})
export class PharmacyInboundComponent {
  activeTab = signal<'commandes' | 'reception'>('commandes');
}
