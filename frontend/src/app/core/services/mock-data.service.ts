import { Injectable } from '@angular/core';
import { Consultation } from '../models/consultation.model';
import { Ordonnance, Medicament } from '../models/ordonnance.model';
import { Triage } from '../models/symptome.model';
import { CodeCIM10, DiagnosticPatient } from '../models/diagnostic.model';
import { AvisExterne } from '../models/avis.model';
import { TicketBorne } from '../models/borne.model';

const today = new Date();
const d = (daysAgo: number, h = 9, m = 0): Date => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() - daysAgo);
  dt.setHours(h, m, 0, 0);
  return dt;
};

export const MOCK_CONSULTATIONS: Consultation[] = [
  {
    id: 'C001', patientId: '1', medecinId: 'DR-NOUR', medecin: 'Dr. Bennaoum Nour',
    dateHeure: d(0, 9, 15), motif: 'Douleur thoracique avec dyspnée',
    anamnese: 'Patient de 38 ans, non fumeur, sans antécédent cardiaque connu. Douleur thoracique à type de serrement depuis ce matin, irradiant vers le bras gauche, avec dyspnée modérée.',
    examenClinique: 'PA: 145/90 mmHg, FC: 98 bpm, T° 37.2°C, SpO2: 96%. Cœur: tons clairs, pas de souffle audible. Poumons: MV bilatéral, pas de crépitants.',
    diagnosticPrincipal: 'Douleur thoracique d\'origine à préciser, suspicion SCA',
    cim10Code: 'I20.9',
    statut: 'EN_COURS', duree: 35
  },
  {
    id: 'C002', patientId: '2', medecinId: 'DR-MESDOUR', medecin: 'Dr. Mesdour R',
    dateHeure: d(0, 10, 30), motif: 'Contrôle diabète',
    anamnese: 'Patiente diabétique de type 2 sous Metformine 500mg x2/j depuis 3 ans. Glycémies récentes autour de 1.8-2.2 g/L. Pas d\'hypoglycémie signalée.',
    examenClinique: 'IMC: 27.4 kg/m². PA: 130/80 mmHg. Examen des pieds: sensibilité conservée, pas de plaie. HbA1c: 8.2%.',
    diagnosticPrincipal: 'Diabète type 2 déséquilibré',
    cim10Code: 'E11.9', statut: 'EN_COURS', duree: 20
  },
  {
    id: 'C003', patientId: '3', medecinId: 'DR-KHELILI', medecin: 'Dr. Khelili M',
    dateHeure: d(1, 9, 0), motif: 'HTA — bilan annuel',
    anamnese: 'Patient hypertendu sous Amlodipine 5mg depuis 2 ans. Tension bien contrôlée habituellement. Ce jour: céphalées occipitales depuis 2 jours.',
    examenClinique: 'PA: 160/95 mmHg en position assise. FC: 78 bpm. Fond d\'œil: pas de rétinopathie. Bilan biologique: créatinine 85 μmol/L, kaliémie 4.0 mEq/L.',
    diagnosticPrincipal: 'HTA décompensée sous traitement',
    cim10Code: 'I10', statut: 'TERMINEE', duree: 25,
    prescriptions: ['Amlodipine 10mg 1cp/j', 'Bisoprolol 5mg 1cp/j'],
    examensdemandes: ['ECG', 'Créatinine sérique', 'Protéinurie 24h']
  },
  {
    id: 'C004', patientId: '4', medecinId: 'DR-NOUR', medecin: 'Dr. Bennaoum Nour',
    dateHeure: d(1, 14, 0), motif: 'Toux persistante depuis 10 jours',
    anamnese: 'Patiente de 24 ans, toux sèche puis productive, légère fièvre à 38.1°C en début d\'évolution. Pas d\'hémoptysie. Vaccins à jour.',
    examenClinique: 'T° 37.4°C. Gorge légèrement érythémateuse. Auscultation pulmonaire: quelques sibilants en base droite. Pas d\'adénopathie cervicale.',
    diagnosticPrincipal: 'Infection des voies respiratoires supérieures',
    cim10Code: 'J06.9', statut: 'TERMINEE', duree: 15,
    prescriptions: ['Paracetamol 1g 3x/j pendant 5j', 'Amoxicilline 1g 2x/j pendant 7j'],
    examensdemandes: ['Radiographie thoracique de face']
  },
  {
    id: 'C005', patientId: '5', medecinId: 'DR-CHOUCHAN', medecin: 'Dr. Chouchan M',
    dateHeure: d(2, 8, 30), motif: 'Lombalgies chroniques',
    anamnese: 'Patient de 59 ans, lombalgies évoluant depuis 6 mois, aggravées par l\'effort et le froid. Pas de signe de Lasègue. Pas de trouble sphinctérien.',
    examenClinique: 'Rachis lombaire raide en flexion, contracture paravertébrale bilatérale. Lasègue négatif. ROT conservés. Pas de déficit sensitif.',
    diagnosticPrincipal: 'Lombalgie chronique commune',
    cim10Code: 'M54.5', statut: 'TERMINEE', duree: 20,
    prescriptions: ['Ibuprofène 400mg 3x/j 7j', 'Myolastan 50mg 1cp le soir'],
    examensdemandes: ['Radiographie lombaire face et profil']
  },
  {
    id: 'C006', patientId: '6', medecinId: 'DR-KHELILI', medecin: 'Dr. Khelili M',
    dateHeure: d(0, 11, 0), motif: 'Brûlures mictionnelles',
    anamnese: 'Patiente de 34 ans, brûlures mictionnelles et pollakiurie depuis 3 jours. Pas de fièvre. Pas d\'antécédent urologique connu.',
    statut: 'EN_ATTENTE'
  },
  {
    id: 'C007', patientId: '7', medecinId: 'DR-MESDOUR', medecin: 'Dr. Mesdour R',
    dateHeure: d(0, 13, 30), motif: 'Céphalées intenses',
    anamnese: 'Patient de 69 ans, céphalées en casque d\'installation brutale ce matin. Pas de fièvre. Pas de signe neurologique focalisé. Hypertendu connu.',
    statut: 'EN_ATTENTE'
  },
  {
    id: 'C008', patientId: '8', medecinId: 'DR-NOUR', medecin: 'Dr. Bennaoum Nour',
    dateHeure: d(0, 15, 0), motif: 'Bilan de routine — jeune patient',
    anamnese: 'Patiente de 20 ans, consulte pour bilan de santé. Aucune plainte fonctionnelle. Pas d\'antécédents médicaux ni chirurgicaux.',
    statut: 'EN_ATTENTE'
  }
];

export const MOCK_ORDONNANCES: Ordonnance[] = [
  {
    id: 'ORD-001', patientId: '3', medecinId: 'DR-KHELILI', medecin: 'Dr. Khelili M',
    date: d(1), type: 'ORDONNANCE', imprime: true, valide: true, dureeTraitement: 30,
    medicaments: [
      { nom: 'Amlodipine', dosage: '10mg', forme: 'comprimé', frequence: '1×/jour', duree: '30 jours', quantite: 30 },
      { nom: 'Bisoprolol', dosage: '5mg', forme: 'comprimé', frequence: '1×/jour', duree: '30 jours', quantite: 30 },
      { nom: 'Aspirine', dosage: '100mg', forme: 'comprimé', frequence: '1×/jour', duree: '30 jours', quantite: 30 }
    ]
  },
  {
    id: 'ORD-002', patientId: '4', medecinId: 'DR-NOUR', medecin: 'Dr. Bennaoum Nour',
    date: d(1), type: 'ORDONNANCE', imprime: false, valide: true, dureeTraitement: 7,
    medicaments: [
      { nom: 'Amoxicilline', dosage: '1g', forme: 'comprimé', frequence: '2×/jour', duree: '7 jours', quantite: 14 },
      { nom: 'Paracetamol', dosage: '1g', forme: 'comprimé', frequence: '3×/jour', duree: '5 jours', quantite: 15, instructions: 'En cas de fièvre ou douleur' }
    ]
  },
  {
    id: 'ORD-003', patientId: '2', medecinId: 'DR-MESDOUR', medecin: 'Dr. Mesdour R',
    date: d(3), type: 'ORDONNANCE', imprime: true, valide: true, dureeTraitement: 90,
    medicaments: [
      { nom: 'Metformine', dosage: '500mg', forme: 'comprimé', frequence: '2×/jour', duree: '3 mois', quantite: 180 },
      { nom: 'Glibenclamide', dosage: '5mg', forme: 'comprimé', frequence: '1×/jour', duree: '3 mois', quantite: 90, instructions: 'Prendre au milieu du repas principal' }
    ]
  },
  {
    id: 'ORD-004', patientId: '5', medecinId: 'DR-CHOUCHAN', medecin: 'Dr. Chouchan M',
    date: d(2), type: 'ORDONNANCE', imprime: true, valide: true, dureeTraitement: 7,
    medicaments: [
      { nom: 'Ibuprofène', dosage: '400mg', forme: 'comprimé', frequence: '3×/jour', duree: '7 jours', quantite: 21, instructions: 'Prendre au cours des repas' },
      { nom: 'Myolastan', dosage: '50mg', forme: 'comprimé', frequence: '1×/soir', duree: '7 jours', quantite: 7, instructions: 'Peut provoquer somnolence' },
      { nom: 'Oméprazole', dosage: '20mg', forme: 'gélule', frequence: '1×/jour', duree: '14 jours', quantite: 14, instructions: 'À jeun le matin' }
    ]
  },
  {
    id: 'ORD-005', patientId: '1', medecinId: 'DR-NOUR', medecin: 'Dr. Bennaoum Nour',
    date: d(0), type: 'BON_EXAMEN', imprime: false, valide: true,
    medicaments: [],
    notes: 'ECG 12 dérivations + Troponine I + CRP + NFS'
  }
];

export const MOCK_TRIAGES: Triage[] = [
  {
    id: 'TRI-001', patientId: '1',
    dateHeure: d(0, 8, 30), infirmier: 'Inf. Amira B.',
    symptomes: ['Douleur thoracique', 'Dyspnée', 'Palpitations'],
    douleur: 8, temperature: 37.1, tensionSystolique: 145, tensionDiastolique: 90,
    frequenceCardiaque: 130, saturationO2: 88, poids: 78,
    niveauUrgence: 'CRITIQUE', orientationService: 'Urgences', notes: 'Transfert immédiat en salle de déchoquage'
  },
  {
    id: 'TRI-002', patientId: '2',
    dateHeure: d(0, 9, 0), infirmier: 'Inf. Amira B.',
    symptomes: ['Céphalée', 'Nausées', 'Vertiges'],
    douleur: 7, temperature: 37.8, tensionSystolique: 165, tensionDiastolique: 100,
    frequenceCardiaque: 95, saturationO2: 96, poids: 72,
    niveauUrgence: 'URGENT', orientationService: 'Cardiologie'
  },
  {
    id: 'TRI-003', patientId: '3',
    dateHeure: d(0, 10, 0), infirmier: 'Inf. Youcef K.',
    symptomes: ['Douleur abdominale', 'Vomissements', 'Fièvre'],
    douleur: 6, temperature: 38.9, tensionSystolique: 120, tensionDiastolique: 78,
    frequenceCardiaque: 105, saturationO2: 97, poids: 65,
    niveauUrgence: 'URGENT', orientationService: 'Chirurgie'
  },
  {
    id: 'TRI-004', patientId: '4',
    dateHeure: d(0, 11, 30), infirmier: 'Inf. Amira B.',
    symptomes: ['Toux', 'Fièvre'],
    douleur: 3, temperature: 38.2, tensionSystolique: 115, tensionDiastolique: 72,
    frequenceCardiaque: 88, saturationO2: 98, poids: 60,
    niveauUrgence: 'NORMAL', orientationService: 'Médecine générale'
  },
  {
    id: 'TRI-005', patientId: '5',
    dateHeure: d(0, 12, 0), infirmier: 'Inf. Youcef K.',
    symptomes: ['Lombalgies', 'Douleur irradiante'],
    douleur: 5, temperature: 36.9, tensionSystolique: 125, tensionDiastolique: 80,
    frequenceCardiaque: 76, saturationO2: 99, poids: 90,
    niveauUrgence: 'NORMAL', orientationService: 'Médecine générale'
  },
  {
    id: 'TRI-006', patientId: '6',
    dateHeure: d(0, 13, 0), infirmier: 'Inf. Amira B.',
    symptomes: ['Brûlures mictionnelles', 'Pollakiurie'],
    douleur: 4, temperature: 37.2, tensionSystolique: 118, tensionDiastolique: 74,
    frequenceCardiaque: 80, saturationO2: 99, poids: 64,
    niveauUrgence: 'NORMAL', orientationService: 'Médecine générale'
  }
];

export const MOCK_CIM10: CodeCIM10[] = [
  { code: 'E11.9', libelle: 'Diabète sucré de type 2 sans complications', chapitre: 'E', categorie: 'E11', actif: true },
  { code: 'E11.6', libelle: 'Diabète de type 2 avec autres complications précisées', chapitre: 'E', categorie: 'E11', actif: true },
  { code: 'I10', libelle: 'Hypertension artérielle essentielle', chapitre: 'I', categorie: 'I10', actif: true },
  { code: 'I20.9', libelle: 'Angine de poitrine sans précision', chapitre: 'I', categorie: 'I20', actif: true },
  { code: 'I21.0', libelle: 'Infarctus transmural aigu de la paroi antérieure du myocarde', chapitre: 'I', categorie: 'I21', actif: true },
  { code: 'J06.9', libelle: 'Infection aiguë des voies respiratoires supérieures, sans précision', chapitre: 'J', categorie: 'J06', actif: true },
  { code: 'J18.9', libelle: 'Pneumonie, sans précision', chapitre: 'J', categorie: 'J18', actif: true },
  { code: 'K29.7', libelle: 'Gastrite chronique, sans précision', chapitre: 'K', categorie: 'K29', actif: true },
  { code: 'K29.0', libelle: 'Gastrite aiguë hémorragique', chapitre: 'K', categorie: 'K29', actif: true },
  { code: 'M54.5', libelle: 'Lombalgie basse', chapitre: 'M', categorie: 'M54', actif: true },
  { code: 'M54.4', libelle: 'Lumbago avec sciatique', chapitre: 'M', categorie: 'M54', actif: true },
  { code: 'N39.0', libelle: 'Infection des voies urinaires, siège non précisé', chapitre: 'N', categorie: 'N39', actif: true },
  { code: 'Z00.0', libelle: 'Examen médical général', chapitre: 'Z', categorie: 'Z00', actif: true },
  { code: 'A09.9', libelle: 'Autres gastro-entérites et colites d\'origine infectieuse et non précisées', chapitre: 'A', categorie: 'A09', actif: true },
  { code: 'B34.9', libelle: 'Infection à virus, sans précision', chapitre: 'B', categorie: 'B34', actif: true },
  { code: 'C34.9', libelle: 'Tumeur maligne des bronches ou du poumon, sans précision', chapitre: 'C', categorie: 'C34', actif: true },
  { code: 'R51', libelle: 'Céphalée', chapitre: 'R', categorie: 'R51', actif: true },
  { code: 'R07.4', libelle: 'Douleur thoracique, sans précision', chapitre: 'R', categorie: 'R07', actif: true },
  { code: 'R55', libelle: 'Syncope et collapsus', chapitre: 'R', categorie: 'R55', actif: true },
  { code: 'Z51.1', libelle: 'Séance de chimiothérapie pour tumeur', chapitre: 'Z', categorie: 'Z51', actif: true }
];

export const MOCK_DIAGNOSTICS: DiagnosticPatient[] = [
  {
    id: 'DG-001', patientId: '3', consultationId: 'C003',
    codesCIM10: [MOCK_CIM10.find(c => c.code === 'I10')!],
    dateEtablissement: d(1), medecin: 'Dr. Khelili M', typeSortie: 'AMELIORATION'
  },
  {
    id: 'DG-002', patientId: '4', consultationId: 'C004',
    codesCIM10: [MOCK_CIM10.find(c => c.code === 'J06.9')!],
    dateEtablissement: d(1), medecin: 'Dr. Bennaoum Nour', typeSortie: 'GUERISON'
  },
  {
    id: 'DG-003', patientId: '5', consultationId: 'C005',
    codesCIM10: [MOCK_CIM10.find(c => c.code === 'M54.5')!],
    dateEtablissement: d(2), medecin: 'Dr. Chouchan M', typeSortie: 'AMELIORATION'
  }
];

export const MOCK_AVIS: AvisExterne[] = [
  {
    id: 'AV-001', patientId: '1', medecinDemandeur: 'Dr. Bennaoum Nour',
    medecinConsultant: 'Dr. Khelili M', specialite: 'Cardiologie',
    motif: 'Douleur thoracique récurrente avec anomalie ECG — avis spécialisé nécessaire',
    urgence: true, datedemande: d(0, 9, 30), statut: 'EN_ATTENTE', externe: false
  },
  {
    id: 'AV-002', patientId: '3', medecinDemandeur: 'Dr. Khelili M',
    specialite: 'Neurologie',
    motif: 'Céphalées chroniques résistantes au traitement — bilan neurologique demandé',
    urgence: false, datedemande: d(2), statut: 'DEMANDE', externe: false
  },
  {
    id: 'AV-003', patientId: '5', medecinDemandeur: 'Dr. Chouchan M',
    specialite: 'Orthopédie', etablissement: 'CHU Béni Messous',
    motif: 'Lombalgie avec sciatalgie — avis chirurgical pour discectomie',
    urgence: false, datedemande: d(5), dateReponse: d(3),
    reponse: 'Traitement conservateur recommandé 6 semaines avant chirurgie',
    recommendation: 'Traitement ambulatoire',
    statut: 'REPONDU', externe: true
  },
  {
    id: 'AV-004', patientId: '2', medecinDemandeur: 'Dr. Mesdour R',
    specialite: 'Endocrinologie', etablissement: 'Hôpital Mustapha Pacha',
    motif: 'Diabète de type 2 déséquilibré — avis endocrinologique pour ajustement thérapeutique',
    urgence: false, datedemande: d(7), statut: 'ANNULE', externe: true
  }
];

export const MOCK_TICKETS: TicketBorne[] = [
  { id: 'TK-001', numero: 'A-001', patientNom: 'Karim Benali', typeVisite: 'CONSULTATION', service: 'Médecine générale', dateHeure: d(0, 8, 5), statut: 'TERMINE', guichet: 'Guichet 1', imprime: true },
  { id: 'TK-002', numero: 'A-002', patientNom: 'Fatima Meziani', typeVisite: 'CONSULTATION', service: 'Cardiologie', dateHeure: d(0, 8, 22), statut: 'TERMINE', guichet: 'Guichet 2', imprime: true },
  { id: 'TK-003', numero: 'A-003', patientNom: 'Ahmed Larbi', typeVisite: 'URGENCE', service: 'Urgences', dateHeure: d(0, 8, 45), statut: 'EN_COURS', guichet: 'Urgences', imprime: true },
  { id: 'TK-004', numero: 'A-004', patientNom: 'Nassima Aouadi', typeVisite: 'RETRAIT', service: 'Laboratoire', dateHeure: d(0, 9, 10), statut: 'APPELE', guichet: 'Guichet 3', imprime: true, tempsAttenteEstime: 5 },
  { id: 'TK-005', numero: 'A-005', patientNom: 'Omar Brahimi', typeVisite: 'CONSULTATION', service: 'Hémodialyse', dateHeure: d(0, 9, 30), statut: 'EN_ATTENTE', imprime: true, tempsAttenteEstime: 15 },
  { id: 'TK-006', numero: 'A-006', patientNom: 'Samira Boucherit', typeVisite: 'CONSULTATION', service: 'Gynécologie', dateHeure: d(0, 10, 5), statut: 'EN_ATTENTE', imprime: true, tempsAttenteEstime: 25 },
  { id: 'TK-007', numero: 'A-007', patientNom: 'Rachid Hadj Ali', typeVisite: 'RETRAIT', service: 'Radiologie', dateHeure: d(0, 10, 40), statut: 'EN_ATTENTE', imprime: true, tempsAttenteEstime: 30 },
  { id: 'TK-008', numero: 'A-008', typeVisite: 'INFO', service: 'Accueil', dateHeure: d(0, 11, 0), statut: 'EN_ATTENTE', imprime: false, tempsAttenteEstime: 5 }
];

@Injectable({ providedIn: 'root' })
export class MockDataService {
  getConsultations(): Consultation[] { return MOCK_CONSULTATIONS; }
  getConsultation(id: string): Consultation | undefined { return MOCK_CONSULTATIONS.find(c => c.id === id); }
  getConsultationsByStatut(statut: string): Consultation[] { return MOCK_CONSULTATIONS.filter(c => c.statut === statut); }

  getOrdonnances(): Ordonnance[] { return MOCK_ORDONNANCES; }
  getOrdonnance(id: string): Ordonnance | undefined { return MOCK_ORDONNANCES.find(o => o.id === id); }

  getTriages(): Triage[] { return MOCK_TRIAGES; }
  getTriage(id: string): Triage | undefined { return MOCK_TRIAGES.find(t => t.id === id); }

  getCIM10(): CodeCIM10[] { return MOCK_CIM10; }
  searchCIM10(query: string): CodeCIM10[] {
    const q = query.toLowerCase();
    return MOCK_CIM10.filter(c => c.code.toLowerCase().includes(q) || c.libelle.toLowerCase().includes(q));
  }

  getDiagnostics(): DiagnosticPatient[] { return MOCK_DIAGNOSTICS; }

  getAvis(): AvisExterne[] { return MOCK_AVIS; }
  getAvis_(id: string): AvisExterne | undefined { return MOCK_AVIS.find(a => a.id === id); }

  getTickets(): TicketBorne[] { return MOCK_TICKETS; }
}
