import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

@Component({
  selector: 'hm-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="breadcrumb" aria-label="Fil d'Ariane">
      @for (item of items; track item.label; let last = $last) {
        @if (last) {
          <span class="bc-current">{{ item.label }}</span>
        } @else {
          <a class="bc-link" [routerLink]="item.route">{{ item.label }}</a>
          <span class="bc-sep">›</span>
        }
      }
    </nav>
  `,
  styles: [`
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .bc-link {
      color: var(--color-text-muted, #64748b);
      text-decoration: none;
      transition: color 0.15s;
      &:hover { color: var(--color-primary, #00BCD4); }
    }
    .bc-sep { color: var(--color-border-strong, #cbd5e1); font-weight: 300; }
    .bc-current { color: var(--color-text, #0f172a); font-weight: 600; }
  `]
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
}
