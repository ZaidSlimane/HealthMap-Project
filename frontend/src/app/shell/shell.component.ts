import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="shell-layout">
      <app-sidebar [collapsed]="sidebarCollapsed()"></app-sidebar>
      <div class="shell-main" [class.sidebar-collapsed]="sidebarCollapsed()">
        <app-header (toggleSidebar)="sidebarCollapsed.set(!sidebarCollapsed())"></app-header>
        <main class="shell-content page-fade-in">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    .shell-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin-left: var(--sidebar-width);
      transition: margin-left 0.3s ease;
      min-width: 0;
    }
    .shell-main.sidebar-collapsed {
      margin-left: var(--sidebar-collapsed-width);
    }
    .shell-content {
      flex: 1;
      overflow-y: auto;
      background: var(--color-bg);
      padding: var(--space-6);
    }
  `]
})
export class ShellComponent {
  sidebarCollapsed = signal(false);
}
