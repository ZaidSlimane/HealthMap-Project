export type Genre = 'M' | 'F';
export type SituationFamiliale = 'Célibataire' | 'Marié(e)' | 'Divorcé(e)' | 'Veuf(ve)';
export type EtatSortie =
  | 'EN_COURS'
  | 'GUERISON'
  | 'AMELIORATION'
  | 'TRANSFERT'
  | 'DECES'
  | 'EVASION'
  | 'CONTRE_AVIS'
  | 'NON_VENU';

export interface PieceIdentite {
  type: 'CIN' | 'Passeport' | 'Permis' | 'Acte de naissance' | 'Autre';
  numero: string;
  delivreLe?: string;
  delivrePar?: string;
}

export interface Adresse {
  rue: string;
  ville: string;
  wilaya: string;
  codePostal?: string;
}

export interface Accompagnant {
  nom: string;
  prenom: string;
  lien: string;
  telephone: string;
}

export interface ContactUrgence {
  nom: string;
  prenom: string;
  lien: string;
  telephone: string;
  adresse?: string;
}

export interface AdmissionEntree {
  id: string;
  dossierId: string;
  date: string;
  service: string;
  unite?: string;
  motif: string;
  medecin: string;
  mode: 'Admission normale' | 'Urgence' | 'Programmée';
  etatSortie: EtatSortie;
  dateSortie?: string;
}

export interface DossierMedical {
  id: string;            // numéro de dossier auto-généré
  patientId: string;
  ouvertLe: number;      // timestamp
  parcours: AdmissionEntree[];
  facturation: {
    typePriseEnCharge: 'Payant' | 'Assurance' | 'CNAS' | 'Indigent' | null;
    assurance?: { organisme: string; numero: string };
    montantTotal: number;
    montantRegle: number;
  };
  impressions: {
    bulletinAdmissionImprime: boolean;
    bulletinSortieImprime: boolean;
    fichierMedicalImprime: boolean;
  };
}

export interface Patient {
  id: string;
  // État civil
  nomFr: string;
  prenomFr: string;
  nomAr?: string;
  prenomAr?: string;
  nin?: string;          // Numéro d'Identification National (18 chars)
  genre: Genre;
  dateNaissance: string; // ISO yyyy-mm-dd
  lieuNaissance?: string;
  groupeSanguin?: string;
  situationFamiliale?: SituationFamiliale;
  profession?: string;
  nationalite: string;
  // Filiation (parental information)
  pereNom?: string;          // Father's first name
  pereNomAr?: string;        // Father's first name (Arabic)
  mereNom?: string;          // Mother's first name
  mereNomAr?: string;        // Mother's first name (Arabic)
  mereNomFille?: string;     // Mother's last name (maiden name)
  mereNomFilleAr?: string;   // Mother's last name (Arabic)
  // Coordonnées
  telephone?: string;
  email?: string;
  adresse: Adresse;
  // Pièce
  piece?: PieceIdentite;
  // Optionnels
  accompagnant?: Accompagnant;
  contactUrgence?: ContactUrgence;
  // Méta
  createdAt: number;
  dossierId: string; // 1-1 with dossier
}

export interface PatientWithDossier {
  patient: Patient;
  dossier: DossierMedical;
}

export const ETAT_SORTIE_META: Record<EtatSortie, { label: string; color: string; icon: string }> = {
  EN_COURS:    { label: 'En cours',          color: '#1E88E5', icon: 'hourglass_top' },
  GUERISON:    { label: 'Guérison',          color: '#43A047', icon: 'verified' },
  AMELIORATION:{ label: 'Amélioration',      color: '#26A69A', icon: 'trending_up' },
  TRANSFERT:   { label: 'Transfert',         color: '#7E57C2', icon: 'swap_horiz' },
  DECES:       { label: 'Décès',             color: '#546E7A', icon: 'event_busy' },
  EVASION:     { label: 'Évasion',           color: '#E53935', icon: 'directions_run' },
  CONTRE_AVIS: { label: 'Sortie contre avis',color: '#FB8C00', icon: 'report_gmailerrorred' },
  NON_VENU:    { label: 'Non venu',          color: '#9E9E9E', icon: 'event_busy' },
};
