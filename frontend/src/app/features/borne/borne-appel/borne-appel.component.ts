import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MockDataService } from '../../../core/services/mock-data.service';
import { TicketBorne } from '../../../core/models/borne.model';

@Component({
  selector: 'app-borne-appel',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="appel-screen">
      <div class="appel-header">
        <h1>Gestion de la file d'attente</h1>
        <button class="btn-back" routerLink="/borne"><mat-icon>arrow_back</mat-icon> Accueil</button>
      </div>

      <div class="appel-layout">
        <!-- LEFT: Queue list -->
        <div class="queue-panel">
          <h3 class="qp-title">File d'attente</h3>
          <ul class="queue-list">
            @for (t of enAttente(); track t.id) {
              <li class="qi" [class.active]="currentTicket()?.id === t.id" (click)="currentTicket.set(t)">
                <span class="qi-num">{{ t.numero }}</span>
                <div class="qi-info">
                  <strong>{{ t.patientNom ?? 'Anonyme' }}</strong>
                  <span>{{ t.service }}</span>
                </div>
                <span class="qi-time">{{ t.dateHeure | date:'HH:mm' }}</span>
              </li>
            }
          </ul>
        </div>

        <!-- RIGHT: Call panel -->
        <div class="call-panel">
          <div class="guichet-select">
            <label>Guichet actif:</label>
            <div class="guichet-btns">
              @for (g of guichets; track g) {
                <button [class.active]="selectedGuichet() === g" (click)="selectedGuichet.set(g)">{{ g }}</button>
              }
            </div>
          </div>

          @if (currentTicket()) {
            <div class="current-call">
              <div class="cc-label">TICKET EN COURS D'APPEL</div>
              <div class="cc-num">{{ currentTicket()!.numero }}</div>
              <div class="cc-patient">{{ currentTicket()!.patientNom ?? 'Anonyme' }}</div>
              <div class="cc-service">{{ currentTicket()!.service }}</div>
              <div class="cc-guichet">{{ selectedGuichet() }}</div>
            </div>

            <div class="call-actions">
              <button class="ca-btn ca-suivant" (click)="appellerSuivant()"><mat-icon>call</mat-icon> Appeler le suivant</button>
              <button class="ca-btn ca-absent" (click)="marquerAbsent()"><mat-icon>person_off</mat-icon> Absent</button>
              <button class="ca-btn ca-terminer" (click)="terminer()"><mat-icon>check</mat-icon> Terminer</button>
            </div>
          } @else {
            <div class="no-call">
              <mat-icon>queue</mat-icon>
              <p>Sélectionnez un ticket dans la file ou appelez le suivant</p>
              <button class="ca-btn ca-suivant" (click)="appellerSuivant()"><mat-icon>call</mat-icon> Appeler le suivant</button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .appel-screen { min-height: 100vh; background: #1A1A2E; color: #fff; padding: var(--space-6); }
    .appel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6); h1 { font-size: 22px; font-weight: 700; margin: 0; } }
    .btn-back { display: inline-flex; align-items: center; gap: var(--space-2); background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius-md); padding: 8px var(--space-4); font-size: 13px; color: #fff; cursor: pointer; mat-icon { font-size: 16px; } }
    .appel-layout { display: grid; grid-template-columns: 320px 1fr; gap: var(--space-6); }
    .queue-panel { background: rgba(255,255,255,0.05); border-radius: var(--radius-xl); padding: var(--space-4); }
    .qp-title { font-size: 14px; font-weight: 700; text-transform: uppercase; color: rgba(255,255,255,0.5); margin: 0 0 var(--space-3); }
    .queue-list { list-style: none; padding: 0; margin: 0; }
    .qi { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border-radius: var(--radius-md); cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.06); &:hover { background: rgba(255,255,255,0.05); } &.active { background: rgba(0,188,212,0.15); border-left: 3px solid #00BCD4; } }
    .qi-num { font-family: var(--font-mono); font-size: 18px; font-weight: 700; color: #00BCD4; min-width: 52px; }
    .qi-info { flex: 1; strong { display: block; font-size: 13px; } span { font-size: 11px; color: rgba(255,255,255,0.5); } }
    .qi-time { font-size: 11px; color: rgba(255,255,255,0.5); }
    .call-panel { background: rgba(255,255,255,0.05); border-radius: var(--radius-xl); padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-5); }
    .guichet-select { label { font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: var(--space-2); display: block; } }
    .guichet-btns { display: flex; gap: var(--space-2); button { padding: 8px var(--space-4); border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.2); background: transparent; color: rgba(255,255,255,0.7); font-size: 13px; cursor: pointer; &.active { background: #00BCD4; border-color: #00BCD4; color: #fff; font-weight: 700; } } }
    .current-call { text-align: center; padding: var(--space-6); background: rgba(0,188,212,0.08); border-radius: var(--radius-xl); border: 1px solid rgba(0,188,212,0.3); }
    .cc-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #00BCD4; letter-spacing: 0.1em; }
    .cc-num { font-size: 96px; font-weight: 900; color: #fff; line-height: 1; margin: var(--space-3) 0; }
    .cc-patient { font-size: 20px; font-weight: 600; margin-bottom: var(--space-2); }
    .cc-service { font-size: 14px; color: rgba(255,255,255,0.7); }
    .cc-guichet { font-size: 16px; font-weight: 700; color: #00BCD4; margin-top: var(--space-2); }
    .call-actions { display: flex; gap: var(--space-3); }
    .ca-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); padding: var(--space-4); border-radius: var(--radius-xl); border: none; font-size: 14px; font-weight: 700; cursor: pointer; mat-icon { font-size: 22px; } &.ca-suivant { background: #00BCD4; color: #fff; } &.ca-absent { background: rgba(255,152,0,0.2); color: #FFB74D; border: 1px solid rgba(255,152,0,0.4); } &.ca-terminer { background: rgba(76,175,80,0.2); color: #81C784; border: 1px solid rgba(76,175,80,0.4); } }
    .no-call { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); flex: 1; justify-content: center; color: rgba(255,255,255,0.5); mat-icon { font-size: 48px; } p { font-size: 14px; text-align: center; } }
  `]
})
export class BorneAppelComponent {
  private mockData = inject(MockDataService);

  currentTicket = signal<TicketBorne | null>(null);
  selectedGuichet = signal('Guichet 1');
  guichets = ['Guichet 1', 'Guichet 2', 'Guichet 3'];

  enAttente = () => this.mockData.getTickets().filter(t => t.statut === 'EN_ATTENTE' || t.statut === 'EN_COURS');

  appellerSuivant(): void {
    const next = this.enAttente().find(t => t.statut === 'EN_ATTENTE');
    if (next) this.currentTicket.set(next);
  }

  marquerAbsent(): void { this.currentTicket.set(null); }
  terminer(): void { this.currentTicket.set(null); }
}
