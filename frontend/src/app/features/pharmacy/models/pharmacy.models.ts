// ── Backend API shapes (snake_case from Laravel) ─────────────────────────────

export interface DciApi {
  id: number;
  code: string;
  denomination: string;
  classification: 'nationale' | 'orse' | 'strategique';
  classe_therapeutique: string | null;
}

export interface FournisseurApi {
  id: number;
  nom: string;
  type: 'fournisseur' | 'laboratoire';
  contact: string | null;
  email: string | null;
  telephone: string | null;
}

export interface ProduitApi {
  id: number;
  code_nomenclature: string;
  nom_commercial: string;
  dci_id: number | null;
  dci: DciApi | null;
  fournisseur_id: number | null;
  fournisseur: FournisseurApi | null;
  forme: string | null;
  dosage: string | null;
  unite: string;
  stock_actuel: number;
  seuil_min: number;
  seuil_securite: number;
  prix_unitaire: number | null;
  is_psychotrope: boolean;
  is_stupefiant: boolean;
  stock_status?: 'critique' | 'alerte' | 'ok';
}

export interface LigneCommandeApi {
  id: number;
  commande_id: number;
  produit_id: number;
  produit: ProduitApi | null;
  qte_commandee: number;
  qte_recue: number;
  lot: string | null;
  date_expiration: string | null;
  prix_unitaire: number | null;
}

export interface CommandeApi {
  id: number;
  reference: string;
  fournisseur_id: number;
  fournisseur: FournisseurApi | null;
  date_commande: string;
  statut: 'en_attente' | 'confirmee' | 'recue';
  notes: string | null;
  lignes: LigneCommandeApi[];
}

export interface MouvementStockApi {
  id: number;
  produit_id: number;
  produit: ProduitApi | null;
  type: 'entree' | 'sortie' | 'ajustement';
  quantite: number;
  stock_avant: number;
  stock_apres: number;
  reference: string | null;
  source_destination: string | null;
  motif: string | null;
  created_at: string;
}

// ── Frontend view-model shapes (camelCase used by components) ────────────────

export interface Dci {
  id: string;
  code: string;
  denomination: string;
  classification: 'nationale' | 'orse' | 'strategique';
  classeTherapeutique: string;
}

export interface Fournisseur {
  id: string;
  nom: string;
  type: 'fournisseur' | 'laboratoire';
  contact: string;
}

export interface Produit {
  id: string;
  codeNomenclature: string;
  nomCommercial: string;
  dciId: string;
  fournisseurId: string;
  forme: string;
  dosage: string;
  stockActuel: number;
  seuilMin: number;
  seuilSecurite: number;
}

export interface LigneCommande {
  produitId: string;
  qteCommandee: number;
  qteRecue: number;
  lot: string;
  dateExpiration: string;
}

export interface Commande {
  id: string;
  reference: string;
  fournisseurId: string;
  dateCommande: string;
  statut: 'en_attente' | 'confirmee' | 'recue';
  lignes: LigneCommande[];
}

export interface MouvementStock {
  id: string;
  produitId: string;
  type: 'entree' | 'sortie';
  quantite: number;
  reference: string;
  serviceOuFournisseur: string;
  date: string;
}

// ── Dashboard-specific shapes ─────────────────────────────────────────────────

export interface DashboardKpis {
  produits_en_stock: number;
  alertes_critiques: number;
  commandes_en_attente: number;
  valeur_totale_stock: number;
}

export interface AlertItem {
  id: number;
  nom_commercial: string;
  dci: string | null;
  stock_actuel: number;
  seuil_min: number;
  statut: 'critique' | 'alerte';
}

export interface PendingOrder {
  id: number;
  reference: string;
  fournisseur: string | null;
  date_commande: string;
  nb_produits: number;
  statut: 'en_attente' | 'confirmee' | 'recue';
}

export interface RecentMovement {
  id: number;
  produit: string | null;
  type: 'entree' | 'sortie' | 'ajustement';
  quantite: number;
  service_fournisseur: string | null;
  date: string;
}
