import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { PatientService, RadioRequest } from '../../core/services/patient.service';

@Component({
  selector: 'app-radiology-requests',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterModule],
  templateUrl: './radiology-requests.component.html',
  styleUrl: './radiology-requests.component.scss'
})
export class RadiologyRequestsComponent {
  private patientService = inject(PatientService);
  urgentRequests: RadioRequest[] = this.patientService.getUrgentRadioRequests();
  calendarView: 'mois' | 'semaine' | 'jour' = 'jour';
  calendarDate = new Date(2023, 4, 22);
  hours = Array.from({ length: 13 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);

  get formattedDate(): string {
    return this.calendarDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  prevDay() { this.calendarDate = new Date(this.calendarDate.getTime() - 86400000); }
  nextDay() { this.calendarDate = new Date(this.calendarDate.getTime() + 86400000); }
  today() { this.calendarDate = new Date(2023, 4, 22); }
}
