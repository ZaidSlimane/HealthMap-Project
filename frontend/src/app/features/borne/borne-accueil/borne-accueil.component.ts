import { Component, signal, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-borne-accueil',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="borne-screen">
      <div class="borne-top">
        <div class="borne-logo">
          <div class="logo-sq">H</div>
          <span class="logo-name">Health<strong>Map</strong></span>
        </div>
        <div class="borne-clock">{{ currentTime() }}</div>
        <div class="borne-date">{{ currentDate() }}</div>
      </div>

      <h1 class="borne-welcome">Bienvenue à l'accueil</h1>
      <p class="borne-sub">Sélectionnez votre type de visite pour obtenir un ticket</p>

      <div class="borne-buttons">
        @for (btn of buttons; track btn.id) {
          <button class="borne-btn" [routerLink]="btn.route">
            <mat-icon class="bb-icon">{{ btn.icon }}</mat-icon>
            <span class="bb-label">{{ btn.label }}</span>
          </button>
        }
      </div>

      <div class="queue-status">
        <mat-icon>people</mat-icon>
        <span>File d'attente: <strong>8 patients</strong></span>
        <span class="qs-sep">·</span>
        <span>Temps d'attente estimé: <strong>25 min</strong></span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .borne-screen { min-height: 100vh; background: linear-gradient(135deg, #006064 0%, #00838F 50%, #0097A7 100%); display: flex; flex-direction: column; align-items: center; padding: var(--space-8); color: #fff; }
    .borne-top { width: 100%; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-8); }
    .borne-logo { display: flex; align-items: center; gap: var(--space-3); }
    .logo-sq { width: 48px; height: 48px; background: #fff; color: #006064; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; }
    .logo-name { font-size: 20px; color: #fff; strong { font-weight: 700; } }
    .borne-clock { font-family: var(--font-mono); font-size: 32px; font-weight: 300; color: rgba(255,255,255,0.9); }
    .borne-date { font-size: 14px; color: rgba(255,255,255,0.7); text-align: right; }
    .borne-welcome { font-size: 40px; font-weight: 300; margin: 0 0 var(--space-3); text-align: center; }
    .borne-sub { font-size: 18px; color: rgba(255,255,255,0.8); margin: 0 0 var(--space-8); text-align: center; }
    .borne-buttons { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-5); margin-bottom: var(--space-8); width: 100%; max-width: 600px; }
    .borne-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-3); width: 100%; height: 180px; background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3); border-radius: 20px; color: #fff; cursor: pointer; transition: all 0.2s; backdrop-filter: blur(8px); &:hover { background: rgba(255,255,255,0.25); transform: scale(1.05); } }
    .bb-icon { font-size: 52px; }
    .bb-label { font-size: 18px; font-weight: 600; }
    .queue-status { display: flex; align-items: center; gap: var(--space-3); background: rgba(255,255,255,0.12); border-radius: var(--radius-full); padding: var(--space-3) var(--space-5); font-size: 14px; mat-icon { font-size: 18px; } }
    .qs-sep { color: rgba(255,255,255,0.5); }
  `]
})
export class BorneAccueilComponent implements OnInit, OnDestroy {
  currentTime = signal('');
  currentDate = signal('');
  private intervalId?: ReturnType<typeof setInterval>;

  buttons = [
    { id: 'consultation', icon: 'local_hospital', label: 'Nouvelle Consultation', route: '/borne/inscription' },
    { id: 'retrait', icon: 'assignment', label: 'Retrait de résultats', route: '/borne/inscription' },
    { id: 'urgence', icon: 'emergency', label: 'Urgence', route: '/borne/inscription' },
    { id: 'info', icon: 'info', label: 'Informations', route: '/borne/historique' },
  ];

  ngOnInit(): void {
    this.updateTime();
    this.intervalId = setInterval(() => this.updateTime(), 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    this.currentDate.set(now.toLocaleDateString('fr-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }
}
