import { Patient } from '../services/patient.service';

export type StatutConsultation = 'EN_ATTENTE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

export interface Consultation {
  id: string;
  patientId: string;
  patient?: Patient;
  admissionId?: string;
  medecinId: string;
  medecin?: string;
  dateHeure: Date;
  motif: string;
  anamnese?: string;
  examenClinique?: string;
  diagnosticPrincipal?: string;
  diagnosticsSecondaires?: string[];
  cim10Code?: string;
  prescriptions?: string[];
  examensdemandes?: string[];
  notesMedecin?: string;
  statut: StatutConsultation;
  duree?: number;
}
