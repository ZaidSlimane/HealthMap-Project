import { Component, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-borne-ticket',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="no-print back-btn-wrap">
      <button routerLink="/borne" class="btn-back"><mat-icon>home</mat-icon> Accueil</button>
      <button (click)="print()" class="btn-print-now"><mat-icon>print</mat-icon> Imprimer</button>
    </div>

    <div class="ticket-content">
      <div class="ticket-header">
        <strong>ÉTABLISSEMENT PUBLIC HOSPITALIER</strong>
        <p>HealthMap System</p>
      </div>

      <div class="ticket-service">{{ service }}</div>

      <div class="ticket-number">{{ ticketNum }}</div>

      <div class="ticket-info">
        <p class="ti-patient">Patient: <strong>{{ patientNom }}</strong></p>
        <p class="ti-date">{{ ticketDate | date:'dd/MM/yyyy HH:mm' }}</p>
        <p class="ti-wait">Temps d'attente estimé: <strong>{{ waitTime }} min</strong></p>
      </div>

      <div class="qr-placeholder">
        <div class="qr-box">
          <mat-icon>qr_code_2</mat-icon>
        </div>
        <p>Scanner pour statut en temps réel</p>
      </div>

      <p class="ticket-thanks">Merci de patienter dans la salle d'attente</p>
      <p class="ticket-footer">Ce ticket est valable uniquement pour la journée du {{ ticketDate | date:'dd/MM/yyyy' }}</p>
    </div>

    @if (countdown() > 0) {
      <div class="no-print countdown-bar">
        Retour automatique à l'accueil dans <strong>{{ countdown() }}</strong> secondes
        <button routerLink="/borne" class="btn-retour">Retourner maintenant</button>
      </div>
    }
  `,
  styles: [`
    .no-print { @media print { display: none !important; } }
    .back-btn-wrap { display: flex; gap: var(--space-3); padding: var(--space-4); background: var(--color-background); border-bottom: 1px solid var(--color-border); }
    .btn-back, .btn-print-now { display: inline-flex; align-items: center; gap: var(--space-2); border-radius: var(--radius-md); padding: 8px var(--space-4); font-size: 13px; cursor: pointer; mat-icon { font-size: 16px; } }
    .btn-back { background: transparent; border: 1px solid var(--color-border); color: var(--color-text-muted); }
    .btn-print-now { background: var(--color-primary); color: #fff; border: none; font-weight: 600; }
    .ticket-content { max-width: 360px; margin: var(--space-6) auto; background: #fff; border: 2px solid #000; border-radius: 8px; padding: var(--space-6); text-align: center; font-family: 'Courier New', monospace; }
    .ticket-header { border-bottom: 1px dashed #000; padding-bottom: var(--space-3); margin-bottom: var(--space-4); strong { font-size: 12px; display: block; } p { font-size: 11px; margin: 4px 0 0; } }
    .ticket-service { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: var(--space-4); border: 2px solid #000; padding: var(--space-2); border-radius: 4px; }
    .ticket-number { font-size: 80px; font-weight: 900; line-height: 1; margin: var(--space-4) 0; color: #006064; }
    .ticket-info { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: var(--space-3) 0; margin: var(--space-4) 0; }
    .ti-patient, .ti-date, .ti-wait { margin: 4px 0; font-size: 13px; }
    .qr-placeholder { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); margin: var(--space-4) 0; }
    .qr-box { width: 80px; height: 80px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; mat-icon { font-size: 48px; color: #000; } }
    .qr-placeholder p { font-size: 10px; color: #666; }
    .ticket-thanks { font-size: 14px; font-weight: 700; margin: var(--space-3) 0 var(--space-2); }
    .ticket-footer { font-size: 10px; color: #666; margin: 0; }
    .countdown-bar { text-align: center; padding: var(--space-4); background: var(--color-surface); border-top: 1px solid var(--color-border); font-size: 14px; display: flex; align-items: center; justify-content: center; gap: var(--space-4); }
    .btn-retour { background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); padding: 6px var(--space-4); font-size: 13px; cursor: pointer; }
    @media print { .no-print { display: none !important; } .ticket-content { border: none; margin: 0; padding: 10mm; } }
  `]
})
export class BorneTicketComponent implements OnInit {
  ticketNum = 'A-009';
  service = 'MÉDECINE GÉNÉRALE';
  patientNom = 'Nouveau patient';
  ticketDate = new Date();
  waitTime = 20;
  countdown = signal(5);

  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    setTimeout(() => window.print(), 800);
    this.intervalId = setInterval(() => {
      this.countdown.update(v => {
        if (v <= 1) { clearInterval(this.intervalId); return 0; }
        return v - 1;
      });
    }, 1000);
  }

  print(): void { window.print(); }
}
