export type TypeBorne = 'CONSULTATION' | 'URGENCE' | 'RETRAIT' | 'INFO';

export interface TicketBorne {
  id: string;
  numero: string;
  patientId?: string;
  patientNom?: string;
  patientNis?: string;
  typeVisite: TypeBorne;
  service: string;
  dateHeure: Date;
  statut: 'EN_ATTENTE' | 'APPELE' | 'EN_COURS' | 'TERMINE' | 'ABSENT';
  guichet?: string;
  tempsAttenteEstime?: number;
  imprime: boolean;
}
