import { Patient } from '../services/patient.service';

export type StatutAvis = 'DEMANDE' | 'EN_ATTENTE' | 'REPONDU' | 'ANNULE';

export interface AvisExterne {
  id: string;
  patientId: string;
  patient?: Patient;
  medecinDemandeur: string;
  medecinConsultant?: string;
  specialite: string;
  motif: string;
  urgence: boolean;
  datedemande: Date;
  dateReponse?: Date;
  reponse?: string;
  recommendation?: string;
  statut: StatutAvis;
  externe: boolean;
  etablissement?: string;
}
