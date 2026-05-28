import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';
import { LoadingService } from '../core/services/loading.service';
import { EchoService } from '../core/services/echo.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="shell-layout">
      <!-- Global loading bar -->
      @if (loading.isLoading()) {
        <div class="global-progress">
          <div class="global-progress-bar"></div>
        </div>
      }

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
      position: relative;
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

    /* === Global progress bar === */
    .global-progress {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(0, 188, 212, 0.1);
      z-index: 10000;
      overflow: hidden;
    }

    .global-progress-bar {
      height: 100%;
      background: linear-gradient(90deg,
        transparent 0%,
        var(--color-primary, #00BCD4) 50%,
        transparent 100%);
      animation: progress-slide 1.2s ease-in-out infinite;
    }

    @keyframes progress-slide {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `]
})
export class ShellComponent implements OnInit, OnDestroy {
  sidebarCollapsed = signal(false);
  loading = inject(LoadingService);
  private echoService = inject(EchoService);

  ngOnInit(): void {
    // Start WebSocket connection when shell mounts (user is authenticated)
    this.echoService.startEcho();
  }

  ngOnDestroy(): void {
    this.echoService.stopEcho();
  }
}
