import { Component, signal, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-affichage',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="affichage-screen">
      <div class="aff-left">
        <div class="current-section">
          <div class="now-label">MAINTENANT APPELÉ</div>
          <div class="ticket-display">{{ currentTicket() }}</div>
          <div class="guichet-display">GUICHET {{ currentGuichet() }}</div>
          @if (currentPatient()) {
            <div class="patient-display">{{ currentPatient() }}</div>
          }
        </div>
        <div class="clock-display">{{ clock() }}</div>
      </div>

      <div class="aff-right">
        <div class="next-title">Prochains tickets</div>
        <div class="next-list">
          @for (t of nextTickets(); track t.num; let i = $index) {
            <div class="next-item" [class.slide-in]="true">
              <span class="ni-num">{{ t.num }}</span>
              <span class="ni-guichet">{{ t.guichet }}</span>
            </div>
          }
        </div>
        <div class="hospital-footer">
          <span>Hôpital HealthMap</span>
          <span>{{ today | date:'dd/MM/yyyy' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .affichage-screen { min-height: 100vh; background: #1A1A2E; color: #fff; display: grid; grid-template-columns: 60% 40%; }
    .aff-left { display: flex; flex-direction: column; justify-content: space-between; padding: var(--space-8); border-right: 1px solid rgba(255,255,255,0.1); }
    .current-section { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: var(--space-4); text-align: center; }
    .now-label { font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: #00BCD4; }
    .ticket-display { font-size: 120px; font-weight: 900; line-height: 1; color: #fff; text-shadow: 0 0 40px rgba(0,188,212,0.5); }
    .guichet-display { font-size: 48px; font-weight: 700; color: #00BCD4; }
    .patient-display { font-size: 22px; color: rgba(255,255,255,0.7); }
    .clock-display { font-family: var(--font-mono); font-size: 36px; color: rgba(255,255,255,0.5); text-align: center; padding: var(--space-4); }
    .aff-right { display: flex; flex-direction: column; padding: var(--space-8); }
    .next-title { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(255,255,255,0.5); margin-bottom: var(--space-5); }
    .next-list { display: flex; flex-direction: column; gap: var(--space-3); flex: 1; }
    .next-item { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4); background: rgba(255,255,255,0.06); border-radius: var(--radius-xl); border: 1px solid rgba(255,255,255,0.1); animation: slideIn 0.5s ease-out; }
    @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .ni-num { font-size: 36px; font-weight: 900; color: rgba(255,255,255,0.8); }
    .ni-guichet { font-size: 16px; color: #00BCD4; font-weight: 600; }
    .hospital-footer { display: flex; justify-content: space-between; font-size: 13px; color: rgba(255,255,255,0.4); padding-top: var(--space-5); border-top: 1px solid rgba(255,255,255,0.1); }
  `]
})
export class AffichageComponent implements OnInit, OnDestroy {
  currentTicket = signal('A-004');
  currentGuichet = signal('2');
  currentPatient = signal('Nassima Aouadi');
  clock = signal('');
  today = new Date();

  nextTickets = signal([
    { num: 'A-005', guichet: 'Guichet 1' },
    { num: 'A-006', guichet: 'Guichet 3' },
    { num: 'A-007', guichet: 'Guichet 1' },
  ]);

  private clockInterval?: ReturnType<typeof setInterval>;
  private refreshInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
    this.refreshInterval = setInterval(() => this.simulateUpdate(), 10000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  private updateClock(): void {
    this.clock.set(new Date().toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }

  private simulateUpdate(): void {
    const nums = ['A-010', 'A-011', 'A-012'];
    const idx = Math.floor(Math.random() * nums.length);
    this.currentTicket.set(nums[idx]);
  }
}
