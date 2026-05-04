import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PatientService, RadioRequest } from '../../core/services/patient.service';

@Component({
  selector: 'app-radiology-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './radiology-list.component.html',
  styleUrl: './radiology-list.component.scss'
})
export class RadiologyListComponent {
  private patientService = inject(PatientService);
  requests: RadioRequest[] = this.patientService.getRadioRequests();
  searchTerm = '';
  pageSize = 10;
  displayedColumns = ['no', 'nomPrenom', 'medecin', 'service', 'examen', 'dateRequest', 'rndv', 'action'];
  today = new Date(2023, 4, 22).toISOString().split('T')[0];

  get filtered(): RadioRequest[] {
    if (!this.searchTerm) return this.requests;
    const term = this.searchTerm.toLowerCase();
    return this.requests.filter(r => r.patientName.toLowerCase().includes(term) || r.examType.toLowerCase().includes(term));
  }
}
