import { Patient } from '../services/patient.service';

export type TypeDocument =
  'ORDONNANCE' | 'CERTIFICAT' | 'BON_EXAMEN' | 'BON_RADIO' | 'ARRET_TRAVAIL' | 'EVACUATION';

export interface Medicament {
  nom: string;
  dosage: string;
  forme: string;
  frequence: string;
  duree: string;
  quantite: number;
  instructions?: string;
}

export interface Ordonnance {
  id: string;
  patientId: string;
  patient?: Patient;
  consultationId?: string;
  medecinId: string;
  medecin?: string;
  date: Date;
  type: TypeDocument;
  medicaments: Medicament[];
  dureeTraitement?: number;
  notes?: string;
  imprime: boolean;
  valide: boolean;
}
