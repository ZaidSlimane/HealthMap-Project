import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PatientService, Patient } from '../../core/services/patient.service';

interface Symptom { label: string; checked: boolean; }
interface Specialty { label: string; icon: string; }

@Component({
  selector: 'app-triage',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatCheckboxModule],
  templateUrl: './triage.component.html',
  styleUrl: './triage.component.scss'
})
export class TriageComponent {
  private patientService = inject(PatientService);
  patient: Patient = this.patientService.getCurrentPatient();
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

  get fonctionnelsLeft() { return this.fonctionnels.slice(0, 3); }
  get fonctionnelsRight() { return this.fonctionnels.slice(3); }
  get physiquesLeft() { return this.physiques.slice(0, 7); }
  get physiquesRight() { return this.physiques.slice(7); }
  get checkedCount() { return [...this.fonctionnels, ...this.physiques].filter(s => s.checked).length; }
}
