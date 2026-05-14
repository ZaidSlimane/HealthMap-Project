import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PatientService, Patient } from '../../core/services/patient.service';

interface Medication {
  nom: string;
  qte: number;
  forme: string;
  frequency: string;
  qsp: string;
  jours: number;
}

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './consultation.component.html',
  styleUrl: './consultation.component.scss'
})
export class ConsultationComponent {
  private patientService = inject(PatientService);
  patient: Patient | undefined = this.patientService.getCurrentPatient();
  compteRendu = 'Toux — Depuis quelques jours de type Grasse Nocturne intense';
  medications: Medication[] = [{ nom: '', qte: 1, forme: 'CP', frequency: 'par jour', qsp: '', jours: 7 }];
  selectedModele = '';
  modeles = ['A5 - Sans entête', 'A4 - En-tête complet', 'A5 - En-tête simplifié'];
  documents = [
    'Demande d\'un examen Radiologique',
    'Demande d\'un examen Biologique',
    'Certificat Médical',
    'Certificat aptitude',
    'Demande examen complémentaires'
  ];

  addMedication() {
    this.medications.push({ nom: '', qte: 1, forme: 'CP', frequency: 'par jour', qsp: '', jours: 7 });
  }

  removeMedication(i: number) {
    this.medications.splice(i, 1);
  }
}
