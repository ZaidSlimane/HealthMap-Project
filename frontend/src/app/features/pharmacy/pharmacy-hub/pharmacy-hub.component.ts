import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { PharmacyTopbarComponent } from './pharmacy-topbar.component';
import { PharmacyNavComponent } from './pharmacy-nav.component';

@Component({
  selector: 'hm-pharmacy-hub',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, PharmacyTopbarComponent, PharmacyNavComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pharmacy-hub">
      <hm-pharmacy-topbar></hm-pharmacy-topbar>
      <div class="pharmacy-body">
        <hm-pharmacy-nav></hm-pharmacy-nav>
        <main class="pharmacy-workspace">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .pharmacy-hub {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: var(--color-bg, #F8FAFC);
    }

    .pharmacy-body {
      display: flex;
      flex: 1;
      min-height: 0;
    }

    .pharmacy-workspace {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }
  `],
})
export class PharmacyHubComponent {}
