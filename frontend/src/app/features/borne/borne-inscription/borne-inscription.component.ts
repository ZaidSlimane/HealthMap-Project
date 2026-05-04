import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PatientService } from '../../../core/services/patient.service';

@Component({
  selector: 'app-borne-inscription',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="borne-inscription">
      <div class="bi-header">
        <button class="btn-back" routerLink="/borne"><mat-icon>arrow_back</mat-icon> Accueil</button>
        <h1 class="bi-title">Enregistrement Patient</h1>
        <div class="bi-steps">
          @for (i of [1,2,3]; track i) {
            <div class="step" [class.active]="step() === i" [class.done]="step() > i">
              <span class="step-num">{{ i }}</span>
            </div>
          }
        </div>
      </div>

      @if (step() === 1) {
        <div class="bi-step-content">
          <h2>Identification du patient</h2>
          <div class="nis-input-wrap">
            <mat-icon>badge</mat-icon>
            <input class="nis-input" [(ngModel)]="nisInput" placeholder="Saisir votre N° NIS ou N° dossier..." />
            <button class="btn-search" (click)="searchPatient()"><mat-icon>search</mat-icon> Rechercher</button>
          </div>

          @if (foundPatient()) {
            <div class="patient-confirm-card">
              <mat-icon class="pc-icon">check_circle</mat-icon>
              <div class="pc-info">
                <strong>{{ foundPatient()!.fullName }}</strong>
                <span>Né(e) le {{ foundPatient()!.dob }}</span>
              </div>
              <button class="btn-confirm" (click)="step.set(2)">Confirmer et continuer</button>
            </div>
          }

          <div class="new-patient-toggle">
            <span>Nouveau patient ?</span>
            <button class="btn-new" (click)="step.set(2)">S'inscrire comme nouveau patient</button>
          </div>
        </div>
      }

      @if (step() === 2) {
        <div class="bi-step-content">
          <h2>Motif de visite</h2>
          <div class="service-buttons">
            @for (s of services; track s.value) {
              <button class="svc-btn" [class.active]="selectedService() === s.value" (click)="selectedService.set(s.value)">
                <mat-icon>{{ s.icon }}</mat-icon>
                <span>{{ s.label }}</span>
              </button>
            }
          </div>
          <div class="urgence-row">
            <button class="urgence-big" [class.active]="isUrgent()" (click)="isUrgent.set(!isUrgent())">
              <mat-icon>emergency</mat-icon> {{ isUrgent() ? 'URGENCE DÉCLARÉE' : 'Déclarer une urgence' }}
            </button>
          </div>
          <div class="btn-nav-row">
            <button class="btn-prev" (click)="step.set(1)"><mat-icon>arrow_back</mat-icon> Retour</button>
            <button class="btn-next" (click)="step.set(3)" [disabled]="!selectedService()">Continuer <mat-icon>arrow_forward</mat-icon></button>
          </div>
        </div>
      }

      @if (step() === 3) {
        <div class="bi-step-content">
          <h2>Confirmation</h2>
          <div class="confirm-card">
            <div class="cc-row"><span class="cc-label">Patient :</span><strong>{{ foundPatient()?.fullName ?? 'Nouveau patient' }}</strong></div>
            <div class="cc-row"><span class="cc-label">Service :</span><strong>{{ selectedService() }}</strong></div>
            <div class="cc-row"><span class="cc-label">Heure :</span><strong>{{ now | date:'HH:mm' }}</strong></div>
            @if (isUrgent()) {
              <div class="urgence-tag"><mat-icon>emergency</mat-icon> URGENCE</div>
            }
          </div>
          <div class="btn-nav-row">
            <button class="btn-prev" (click)="step.set(2)"><mat-icon>arrow_back</mat-icon> Retour</button>
            <button class="btn-print-ticket" routerLink="/borne/ticket">
              <mat-icon>print</mat-icon> Imprimer mon ticket
            </button>
          </div>
          <button class="btn-cancel-big" routerLink="/borne">Annuler</button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .borne-inscription { min-height: 100vh; background: #F0F4F8; padding: var(--space-6); }
    .bi-header { display: flex; align-items: center; gap: var(--space-5); margin-bottom: var(--space-8); }
    .btn-back { display: inline-flex; align-items: center; gap: var(--space-2); background: #fff; border: 1px solid #ddd; border-radius: var(--radius-md); padding: 10px var(--space-4); font-size: 13px; cursor: pointer; mat-icon { font-size: 18px; } }
    .bi-title { font-size: 24px; font-weight: 700; margin: 0; flex: 1; color: #1A1A2E; }
    .bi-steps { display: flex; gap: var(--space-2); }
    .step { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #CBD5E0; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: #CBD5E0; &.active { border-color: #00BCD4; color: #00BCD4; } &.done { background: #00BCD4; border-color: #00BCD4; color: #fff; } }
    .bi-step-content { max-width: 640px; margin: 0 auto; }
    h2 { font-size: 22px; font-weight: 600; margin: 0 0 var(--space-6); color: #1A1A2E; }
    .nis-input-wrap { display: flex; align-items: center; gap: var(--space-3); background: #fff; border: 2px solid #CBD5E0; border-radius: 12px; padding: var(--space-3) var(--space-4); margin-bottom: var(--space-5); mat-icon { color: #00BCD4; font-size: 24px; } }
    .nis-input { flex: 1; border: none; background: transparent; outline: none; font-size: 18px; color: #1A1A2E; }
    .btn-search { background: #00BCD4; color: #fff; border: none; border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 14px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: var(--space-2); mat-icon { font-size: 18px; } }
    .patient-confirm-card { background: rgba(0,188,212,0.08); border: 1px solid rgba(0,188,212,0.3); border-radius: 12px; padding: var(--space-4); display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-5); }
    .pc-icon { font-size: 32px; color: #00BCD4; }
    .pc-info { flex: 1; strong { display: block; font-size: 18px; } span { font-size: 14px; color: #555; } }
    .btn-confirm { background: #00BCD4; color: #fff; border: none; border-radius: var(--radius-md); padding: 10px var(--space-4); font-size: 14px; font-weight: 600; cursor: pointer; }
    .new-patient-toggle { text-align: center; font-size: 14px; color: #555; display: flex; align-items: center; gap: var(--space-3); justify-content: center; }
    .btn-new { background: transparent; border: 1px solid #00BCD4; color: #00BCD4; border-radius: var(--radius-md); padding: 8px var(--space-4); font-size: 13px; cursor: pointer; }
    .service-buttons { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); margin-bottom: var(--space-5); }
    .svc-btn { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); padding: var(--space-5); border-radius: 12px; border: 2px solid #CBD5E0; background: #fff; cursor: pointer; font-size: 13px; font-weight: 600; color: #555; transition: all 0.2s; mat-icon { font-size: 32px; color: #00BCD4; } &.active { border-color: #00BCD4; background: rgba(0,188,212,0.08); color: #00BCD4; } }
    .urgence-row { margin-bottom: var(--space-5); }
    .urgence-big { width: 100%; display: flex; align-items: center; justify-content: center; gap: var(--space-3); padding: var(--space-4); border-radius: 12px; border: 2px solid #E53935; background: transparent; font-size: 16px; font-weight: 700; color: #E53935; cursor: pointer; mat-icon { font-size: 24px; } &.active { background: #E53935; color: #fff; } }
    .btn-nav-row { display: flex; justify-content: space-between; margin-top: var(--space-5); }
    .btn-prev, .btn-next { display: inline-flex; align-items: center; gap: var(--space-2); padding: 12px var(--space-5); border-radius: var(--radius-md); font-size: 15px; font-weight: 600; cursor: pointer; mat-icon { font-size: 18px; } }
    .btn-prev { background: transparent; border: 1px solid #CBD5E0; color: #555; }
    .btn-next { background: #00BCD4; color: #fff; border: none; &:disabled { opacity: 0.5; cursor: default; } }
    .confirm-card { background: #fff; border-radius: 12px; padding: var(--space-5); box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: var(--space-5); }
    .cc-row { display: flex; align-items: center; padding: var(--space-3) 0; border-bottom: 1px solid #F0F4F8; font-size: 16px; &:last-child { border: none; } }
    .cc-label { color: #666; min-width: 100px; }
    .urgence-tag { display: inline-flex; align-items: center; gap: var(--space-2); background: #E53935; color: #fff; border-radius: var(--radius-full); padding: 4px 12px; font-size: 13px; font-weight: 700; margin-top: var(--space-3); mat-icon { font-size: 16px; } }
    .btn-print-ticket { display: inline-flex; align-items: center; gap: var(--space-2); background: #00BCD4; color: #fff; border: none; border-radius: var(--radius-md); padding: 14px var(--space-6); font-size: 16px; font-weight: 700; cursor: pointer; mat-icon { font-size: 22px; } }
    .btn-cancel-big { display: block; margin: var(--space-4) auto 0; background: transparent; border: 1px solid #E53935; color: #E53935; border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 14px; cursor: pointer; }
  `]
})
export class BorneInscriptionComponent {
  private patientSvc = inject(PatientService);
  private router = inject(Router);

  step = signal(1);
  nisInput = '';
  foundPatient = signal<{ fullName: string; dob: string } | null>(null);
  selectedService = signal('');
  isUrgent = signal(false);
  now = new Date();

  services = [
    { value: 'Médecine générale', icon: 'medical_services', label: 'Médecine générale' },
    { value: 'Cardiologie', icon: 'favorite', label: 'Cardiologie' },
    { value: 'Urgences', icon: 'emergency', label: 'Urgences' },
    { value: 'Pédiatrie', icon: 'child_care', label: 'Pédiatrie' },
    { value: 'Gynécologie', icon: 'pregnant_woman', label: 'Gynécologie' },
    { value: 'Laboratoire', icon: 'science', label: 'Laboratoire' },
  ];

  searchPatient(): void {
    const patients = this.patientSvc.getPatients();
    const found = patients.find(p => p.admissionNumber.toString() === this.nisInput);
    if (found) {
      this.foundPatient.set({ fullName: found.fullName, dob: found.dob });
    } else {
      this.foundPatient.set(null);
    }
  }
}
