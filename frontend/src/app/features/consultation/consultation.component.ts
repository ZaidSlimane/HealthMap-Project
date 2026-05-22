import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ConsultationSessionService, SessionPatient } from '../../core/services/consultation-session.service';
import { ExamRequestModalComponent } from './exam-request/exam-request-modal.component';
import { AdmissionModalComponent } from './admission-modal/admission-modal.component';
import { RadioResultPanelComponent } from '../radiology/result-panel/radio-result-panel.component';
import { LaboResultPanelComponent } from '../laboratory/result-panel/labo-result-panel.component';

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
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, ExamRequestModalComponent, AdmissionModalComponent, RadioResultPanelComponent, LaboResultPanelComponent],
  templateUrl: './consultation.component.html',
  styleUrl: './consultation.component.scss'
})
export class ConsultationComponent implements OnInit {
  readonly session = inject(ConsultationSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  patient: SessionPatient | null = null;

  /** Consultation ID from the session service */
  readonly consultationId = computed(() => this.session.consultationId());

  /** Modal visibility signals */
  readonly showRadioModal = signal(false);
  readonly showLaboModal = signal(false);
  readonly showAdmissionModal = signal(false);

  ngOnInit(): void {
    // Resume session from query params if needed
    const params = this.route.snapshot.queryParamMap;
    this.session.resumeFromParams({
      queueId: Number(params.get('queue_id')) || null,
      patientId: Number(params.get('patient_id')) || null,
      serviceId: Number(params.get('service_id')) || null,
      boxId: Number(params.get('box_id')) || null,
    });

    this.patient = this.session.patient();
  }
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

  onExamRequestSubmitted(): void {
    // Refresh result panels after a new exam request is submitted
  }

  onAdmitted(admission: any): void {
    // Stay on the consultation page — just show a success notification
    // The doctor continues the consultation process without interruption
  }
}
