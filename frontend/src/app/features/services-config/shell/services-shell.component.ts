import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/ui/breadcrumb/breadcrumb.component';

@Component({
  selector: 'hm-services-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, BreadcrumbComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="services-shell">
      <hm-breadcrumb [items]="breadcrumbs()" />

      <!-- Tab navigation -->
      <nav class="shell-tabs">
        @for (tab of tabs; track tab.route) {
          <a class="shell-tab"
            [routerLink]="tab.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: tab.exact }">
            {{ tab.label }}
          </a>
        }
      </nav>

      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .services-shell {
      max-width: 1400px;
      margin: 0 auto;
    }
    .shell-tabs {
      display: flex;
      gap: 0;
      margin-bottom: 24px;
      border-bottom: 2px solid var(--color-border, #e2e8f0);
    }
    .shell-tab {
      padding: 10px 20px;
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-muted, #64748b);
      text-decoration: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: all 0.15s;
      &:hover { color: var(--color-text); }
      &.active {
        color: var(--color-primary, #00BCD4);
        border-bottom-color: var(--color-primary, #00BCD4);
      }
    }
  `]
})
export class ServicesShellComponent {
  private router = inject(Router);

  tabs = [
    { label: 'Gestion des services', route: '/admin/services/dashboard', exact: true },
    { label: 'Cliniques de l\'établissement', route: '/admin/services/establishment', exact: true },
    { label: 'Services de l\'établissement', route: '/admin/services/types', exact: true },
  ];

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const url = this.currentUrl();
    const items: BreadcrumbItem[] = [
      { label: 'Administration', route: '/admin/dashboard' },
      { label: 'Services', route: '/admin/services/dashboard' },
    ];

    if (url.includes('/establishment')) {
      items.push({ label: 'Établissement' });
    } else if (url.includes('/types')) {
      items.push({ label: 'Services de l\'établissement' });
    } else if (url.includes('/lits')) {
      items.push({ label: 'Gestion des lits' });
    } else {
      items.push({ label: 'Tableau de bord' });
    }

    return items;
  });
}
