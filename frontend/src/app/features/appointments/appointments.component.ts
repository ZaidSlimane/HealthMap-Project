import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface Appointment { time: string; patient: string; medecin: string; service: string; type: string; }

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page-container page-fade-in">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
        <h2 class="section-title"><mat-icon>calendar_today</mat-icon> Rendez-vous — Radiologie</h2>
        <button mat-flat-button style="background:var(--color-primary);color:white;">
          <mat-icon>add</mat-icon> Nouveau RDV
        </button>
      </div>
      <div class="card-surface">
        @for (apt of appointments; track apt.time) {
          <div class="appointment-row">
            <span class="apt-time">{{ apt.time }}</span>
            <span class="apt-patient">{{ apt.patient }}</span>
            <span class="apt-service">{{ apt.service }}</span>
            <span class="apt-type">{{ apt.type }}</span>
            <span class="apt-doc">{{ apt.medecin }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`.section-title{display:flex;align-items:center;gap:8px;font-size:22px;}
    .appointment-row{display:flex;align-items:center;gap:24px;padding:12px 8px;border-bottom:1px solid #EEE;}
    .apt-time{font-weight:700;color:var(--color-primary);min-width:60px;}
    .apt-patient{font-weight:600;flex:1;}
    .apt-service,.apt-doc{color:#757575;font-size:13px;}
    .apt-type{background:var(--color-info);color:white;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:600;}
  `]
})
export class AppointmentsComponent {
  appointments: Appointment[] = [
    { time: '08:00', patient: 'Karim Benali', medecin: 'Dr. Khelili M', service: 'Radiologie', type: 'THORAX(P)' },
    { time: '09:00', patient: 'Fatima Meziani', medecin: 'Dr. Mesdour R', service: 'Radiologie', type: 'A.S.P(f)' },
    { time: '10:00', patient: 'Ahmed Larbi', medecin: 'Dr. Khelili M', service: 'Radiologie', type: 'A.S.P(f)' },
    { time: '11:00', patient: 'Nassima Aouadi', medecin: 'Dr. Boussaid F', service: 'Radiologie', type: 'IRM Crâne' },
    { time: '14:00', patient: 'Omar Brahimi', medecin: 'Dr. Chouchan M', service: 'Radiologie', type: 'ASP Abdomen' },
  ];
}
