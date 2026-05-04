import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface Alert { type: 'urgence' | 'warning' | 'info' | 'success'; message: string; date: string; }

export const MOCK_ALERTS: Alert[] = [
  { type: 'urgence', message: 'Mise à jour système requise — 387 jours depuis la dernière MAJ', date: '22/05/2023 10:00' },
  { type: 'urgence', message: 'Sauvegarde manquante — 387 jours depuis le dernier backup', date: '22/05/2023 10:00' },
  { type: 'warning', message: 'Lits service Cardiologie à 90% de capacité', date: '22/05/2023 08:30' },
  { type: 'info', message: 'Nouveau patient admis en urgence — N° 208', date: '22/05/2023 10:57' },
  { type: 'success', message: 'Synchronisation base de données complétée avec succès', date: '22/05/2023 09:15' },
];

@Component({
  selector: 'app-alertes',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="page-container page-fade-in">
      <div class="heading-row" style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
        <h1 style="font-size:1.5rem;font-weight:700;font-family:var(--font-heading);letter-spacing:-0.03em;color:#0f172a">Alertes système</h1>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        @for (alert of alerts; track alert.message) {
          <div class="alert-item" [style]="getStyle(alert.type)">
            <mat-icon [style.color]="getColor(alert.type)" style="font-size:20px;flex-shrink:0">
              {{ alert.type === 'urgence' ? 'error' : alert.type === 'warning' ? 'warning' : alert.type === 'success' ? 'check_circle' : 'info' }}
            </mat-icon>
            <div style="flex:1">
              <div style="font-weight:600;font-size:0.88rem" [style.color]="getTextColor(alert.type)">{{ alert.message }}</div>
              <div style="font-size:0.75rem;color:#94a3b8;margin-top:2px">{{ alert.date }}</div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .alert-item {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 20px;
      border-radius: 10px;
    }
  `]
})
export class AlertesComponent {
  alerts: Alert[] = MOCK_ALERTS;

  getStyle(type: string): string {
    const map: Record<string, string> = {
      urgence: 'background:#fff5f5;border-left:5px solid #E53935;box-shadow:0 2px 8px rgba(229,57,53,0.10)',
      warning: 'background:#fff8f0;border-left:5px solid #FB8C00;box-shadow:0 2px 8px rgba(251,140,0,0.10)',
      info:    'background:#f0f7ff;border-left:5px solid #1E88E5;box-shadow:0 2px 8px rgba(30,136,229,0.10)',
      success: 'background:#f0faf0;border-left:5px solid #43A047;box-shadow:0 2px 8px rgba(67,160,71,0.10)',
    };
    return map[type] || map['info'];
  }

  getColor(type: string): string {
    const map: Record<string, string> = {
      urgence: '#E53935', warning: '#FB8C00', info: '#1E88E5', success: '#43A047'
    };
    return map[type] || '#1E88E5';
  }

  getTextColor(type: string): string {
    const map: Record<string, string> = {
      urgence: '#7f1d1d', warning: '#7c2d12', info: '#1e3a5f', success: '#14532d'
    };
    return map[type] || '#1e3a5f';
  }
}
