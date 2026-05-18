import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ConsultationSessionService } from '../../core/services/consultation-session.service';
import { environment } from '../../../environments/environment';

interface Symptom { label: string; checked: boolean; }
interface Specialty { label: string; icon: string; }

@Component({
  selector: 'app-triage',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatCheckboxModule],
  templateUrl: './triage.component.html',
  styleUrl: './triage.component.scss'
})
export class TriageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly session = inject(ConsultationSessionService);

  readonly queueId = signal<number | null>(null);
  readonly patientId = signal<number | null>(null);
  readonly serviceId = signal<number | null>(null);
  readonly boxId = signal<number | null>(null);
  readonly patient = signal<{ name: string; first_name: string; date_of_birth?: string } | null>(null);

  selectedSpecialty = 0;

  specialties: Specialty[] = [
    { label: 'Pneumo', icon: 'air' },
    { label: 'Cardio', icon: 'favorite' },
    { label: 'Gynéco', icon: 'pregnant_woman' },
    { label: 'Uro', icon: 'water_drop' },
    { label: 'Gastro', icon: 'restaurant' },
    { label: 'Neuro', icon: 'psychology' },
    { label: 'Endocrino', icon: 'biotech' },
  ];

  fonctionnels: Symptom[] = [
    { label: 'Toux', checked: false },
    { label: 'Hémoptysie', checked: false },
    { label: 'Dyspnée', checked: false },
    { label: 'Expectorations', checked: false },
    { label: 'Douleur Thoracique', checked: false },
  ];

  physiques: Symptom[] = [
    { label: 'Cyanose', checked: false },
    { label: 'Déformation thoracique', checked: false },
    { label: 'Vibrations vocales augmentées', checked: false },
    { label: 'Tympanisme', checked: false },
    { label: 'Râles sous-crépitants', checked: false },
    { label: 'Râles ronflants', checked: false },
    { label: 'Murmure vésiculaire aboli', checked: false },
    { label: 'Hypocratisme digital', checked: false },
    { label: 'Vibrations vocales diminuées', checked: false },
    { label: 'Matité', checked: false },
    { label: 'Râles crépitants', checked: false },
    { label: 'Râles sibilants', checked: false },
    { label: 'Murmure vésiculaire diminué', checked: false },
  ];

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const queueId = Number(params.get('queue_id')) || null;
    const patientId = Number(params.get('patient_id')) || null;
    const serviceId = Number(params.get('service_id')) || null;
    const boxId = Number(params.get('box_id')) || null;

    // Resume session from params (or use existing session from storage)
    this.session.resumeFromParams({ queueId, patientId, serviceId, boxId });

    this.queueId.set(queueId ?? this.session.queueId());
    this.patientId.set(patientId ?? this.session.session()?.patientId ?? null);
    this.serviceId.set(serviceId ?? this.session.session()?.serviceId ?? null);
    this.boxId.set(boxId ?? this.session.session()?.boxId ?? null);

    // Use patient from session if available, otherwise load from API
    const sessionPatient = this.session.patient();
    if (sessionPatient) {
      this.patient.set(sessionPatient);
    } else if (this.patientId()) {
      this.loadPatient(this.patientId()!);
    }
  }

  get fonctionnelsLeft() { return this.fonctionnels.slice(0, 3); }
  get fonctionnelsRight() { return this.fonctionnels.slice(3); }
  get physiquesLeft() { return this.physiques.slice(0, 7); }
  get physiquesRight() { return this.physiques.slice(7); }
  get checkedCount() { return [...this.fonctionnels, ...this.physiques].filter(s => s.checked).length; }

  cancel(): void {
    this.router.navigate(['/queue/call'], {
      queryParams: {
        service_id: this.serviceId(),
        box_id: this.boxId(),
      }
    });
  }

  next(): void {
    // Save triage findings to the consultation if we have a consultation ID
    const consultationId = this.session.consultationId();
    const checkedSymptoms = [...this.fonctionnels, ...this.physiques].filter(s => s.checked);

    if (consultationId && checkedSymptoms.length > 0) {
      // Fire-and-forget save — don't block navigation
      const findings = checkedSymptoms.map(s => s.label).join(', ');
      this.http.patch(`${environment.baseUrl}/clinical-core/consultations/${consultationId}`, {
        examen_clinique: findings,
      }).subscribe();
    }

    // Forward all context to the consultation screen
    this.router.navigate(['/consultation/active'], {
      queryParams: {
        queue_id: this.queueId(),
        patient_id: this.patientId(),
        service_id: this.serviceId(),
        box_id: this.boxId(),
      }
    });
  }

  private loadPatient(id: number): void {
    this.http.get<any>(`${environment.baseUrl}/clinical-core/patients/${id}`).subscribe({
      next: (p) => {
        this.patient.set({
          name: p.name,
          first_name: p.first_name,
          date_of_birth: p.date_of_birth,
        });
      }
    });
  }
}
