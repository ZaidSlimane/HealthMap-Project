import { Patient } from '../services/patient.service';

export type NiveauUrgence = 'CRITIQUE' | 'URGENT' | 'SEMI_URGENT' | 'NON_URGENT' | 'NORMAL';

export interface Triage {
  id: string;
  patientId: string;
  patient?: Patient;
  dateHeure: Date;
  infirmier: string;
  symptomes: string[];
  douleur: number;
  temperature?: number;
  tensionSystolique?: number;
  tensionDiastolique?: number;
  frequenceCardiaque?: number;
  saturationO2?: number;
  poids?: number;
  niveauUrgence: NiveauUrgence;
  orientationService?: string;
  notes?: string;
}
