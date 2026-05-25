import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'hm-pharmacy-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="pharmacy-topbar">
      <div class="topbar-left">
        <span class="material-icons pharmacy-icon">medication</span>
        <h1 class="topbar-title">Pharmacie Centrale</h1>
      </div>

      <div class="topbar-center">
        <div class="search-box">
          <span class="material-icons">search</span>
          <input type="text" 
            placeholder="Rechercher un produit, DCI..."
            [(ngModel)]="searchQuery"
            (keyup.enter)="onSearch()" />
        </div>
      </div>

      <div class="topbar-right">
        <button class="alert-btn" matTooltip="Alertes stock">
          <span class="material-icons">notifications</span>
          @if (alertCount() > 0) {
            <span class="alert-badge">{{ alertCount() }}</span>
          }
        </button>

        <div class="user-avatar">
          <span class="material-icons">person</span>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .pharmacy-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 64px;
      background: var(--color-surface, #fff);
      border-bottom: 1px solid var(--color-border, #E2E8F0);
      flex-shrink: 0;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .pharmacy-icon {
      font-size: 28px;
      color: var(--color-primary, #00BCD4);
    }

    .topbar-title {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: var(--color-text, #0F172A);
    }

    .topbar-center {
      flex: 1;
      max-width: 400px;
      margin: 0 24px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
      height: 40px;
      background: var(--color-bg, #F1F5F9);
      border-radius: 8px;
      border: 1px solid transparent;
      transition: border-color 0.2s;
    }

    .search-box:focus-within {
      border-color: var(--color-primary, #00BCD4);
    }

    .search-box .material-icons {
      font-size: 20px;
      color: var(--color-text-muted, #64748B);
    }

    .search-box input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 14px;
      color: var(--color-text, #0F172A);
      outline: none;
    }

    .search-box input::placeholder {
      color: var(--color-text-muted, #94A3B8);
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .alert-btn {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .alert-btn:hover {
      background: var(--color-hover, #F1F5F9);
    }

    .alert-btn .material-icons {
      font-size: 24px;
      color: var(--color-text-muted, #64748B);
    }

    .alert-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      background: #EF4444;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--color-primary-light, #E0F7FA);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .user-avatar .material-icons {
      font-size: 24px;
      color: var(--color-primary, #00BCD4);
    }
  `],
})
export class PharmacyTopbarComponent {
  searchQuery = '';

  alertCount = () => 0; // TODO: connect to real data

  onSearch(): void {
    // TODO: implement search
  }
}
