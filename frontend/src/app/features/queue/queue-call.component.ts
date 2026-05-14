import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PatientService, Patient } from '../../core/services/patient.service';

@Component({
  selector: 'app-queue-call',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './queue-call.component.html',
  styleUrl: './queue-call.component.scss'
})
export class QueueCallComponent {
  private patientService = inject(PatientService);
  patient: Patient | undefined = this.patientService.getCurrentPatient();
  queueList = [
    { number: 52, service: 'مكتب الفحص 1' },
    { number: 51, service: 'الإشعة' },
  ];
  historyExpanded = false;
}
