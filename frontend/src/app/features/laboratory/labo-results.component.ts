import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PatientService, LabRequest } from '../../core/services/patient.service';

@Component({
  selector: 'app-labo-results',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './labo-results.component.html',
  styleUrl: './labo-results.component.scss'
})
export class LaboResultsComponent {
  private patientService = inject(PatientService);
  labRequests: LabRequest[] = this.patientService.getLabRequests();
  searchTerm = '';
  viewMode: 'list' | 'grid' = 'list';
  displayedColumns = ['admissionNumber', 'patient', 'service', 'medecin', 'dateRequest', 'action'];

  get filtered(): LabRequest[] {
    if (!this.searchTerm) return this.labRequests;
    const term = this.searchTerm.toLowerCase();
    return this.labRequests.filter(r => r.patientName.toLowerCase().includes(term));
  }
}
