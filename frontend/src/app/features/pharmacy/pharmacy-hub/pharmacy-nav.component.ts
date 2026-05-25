import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'hm-pharmacy-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="pharmacy-nav" [class.collapsed]="collapsed()">
      <button class="collapse-btn" (click)="toggleCollapse()">
        <span class="material-icons">{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</span>
      </button>

      <ul class="nav-list">
        @for (item of navItems; track item.route) {
          <li>
            <a class="nav-item" 
               [routerLink]="item.route"
               routerLinkActive="active"
               [routerLinkActiveOptions]="{exact: false}">
              <span class="material-icons nav-icon">{{ item.icon }}</span>
              @if (!collapsed()) {
                <span class="nav-label">{{ item.label }}</span>
              }
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
  styles: [`
    .pharmacy-nav {
      width: 240px;
      min-width: 240px;
      background: var(--color-surface, #fff);
      border-right: 1px solid var(--color-border, #E2E8F0);
      display: flex;
      flex-direction: column;
      transition: width 0.2s, min-width 0.2s;
      position: relative;
    }

    .pharmacy-nav.collapsed {
      width: 64px;
      min-width: 64px;
    }

    .collapse-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      margin: 8px auto;
      border: none;
      background: var(--color-bg, #F1F5F9);
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .collapse-btn:hover {
      background: var(--color-hover, #E2E8F0);
    }

    .collapse-btn .material-icons {
      font-size: 20px;
      color: var(--color-text-muted, #64748B);
    }

    .nav-list {
      list-style: none;
      margin: 0;
      padding: 8px;
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      text-decoration: none;
      color: var(--color-text, #0F172A);
      font-size: 14px;
      font-weight: 500;
      transition: background 0.15s, color 0.15s;
    }

    .nav-item:hover {
      background: var(--color-hover, #F1F5F9);
    }

    .nav-item.active {
      background: var(--color-primary-light, #E0F7FA);
      color: var(--color-primary-dark, #0097A7);
      font-weight: 600;
    }

    .collapsed .nav-item {
      justify-content: center;
      padding: 12px;
    }

    .nav-icon {
      font-size: 22px;
      flex-shrink: 0;
    }

    .nav-label {
      white-space: nowrap;
      overflow: hidden;
    }
  `],
})
export class PharmacyNavComponent {
  collapsed = signal(false);

  navItems: NavItem[] = [
    { label: 'Tableau de bord', icon: 'layout-dashboard', route: '/pharmacie/dashboard' },
    { label: 'Catalogue', icon: 'book-open', route: '/pharmacie/catalogue' },
    { label: 'Approvisionnement', icon: 'truck', route: '/pharmacie/approvisionnement' },
    { label: 'Distribution', icon: 'send', route: '/pharmacie/distribution' },
    { label: 'Inventaire', icon: 'package-search', route: '/pharmacie/inventaire' },
  ];

  toggleCollapse(): void {
    this.collapsed.update(v => !v);
  }
}
