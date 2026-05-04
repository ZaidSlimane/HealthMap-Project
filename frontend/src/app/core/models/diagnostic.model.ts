export interface CodeCIM10 {
  code: string;
  libelle: string;
  chapitre: string;
  categorie: string;
  sousCategorie?: string;
  actif: boolean;
}

export interface DiagnosticPatient {
  id: string;
  patientId: string;
  consultationId: string;
  codesCIM10: CodeCIM10[];
  dateEtablissement: Date;
  medecin: string;
  typeSortie?: 'GUERISON' | 'AMELIORATION' | 'TRANSFERT' | 'DECES' | 'FUGA';
  notes?: string;
}
