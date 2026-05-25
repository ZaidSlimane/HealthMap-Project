export interface Dci {
  id: number;
  code: string;
  denomination: string;
  classification: 'nationale' | 'orse' | 'strategique';
  classe_therapeutique: string | null;
}

export interface Fournisseur {
  id: number;
  nom: string;
  type: 'fournisseur' | 'laboratoire';
  contact: string | null;
  email: string | null;
  telephone: string | null;
}

export interface Produit {
  id: number;
  code_nomenclature: string;
  nom_commercial: string;
  dci_id: number | null;
  dci: Dci | null;
  fournisseur_id: number | null;
  fournisseur: Fournisseur | null;
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

export interface LigneCommande {
  id: number;
  commande_id: number;
  produit_id: number;
  produit: Produit | null;
  qte_commandee: number;
  qte_recue: number;
  lot: string | null;
  date_expiration: string | null;
  prix_unitaire: number | null;
}

export interface Commande {
  id: number;
  reference: string;
  fournisseur_id: number;
  fournisseur: Fournisseur | null;
  date_commande: string;
  statut: 'en_attente' | 'confirmee' | 'recue';
  notes: string | null;
  lignes: LigneCommande[];
}

export interface MouvementStock {
  id: number;
  produit_id: number;
  produit: Produit | null;
  type: 'entree' | 'sortie' | 'ajustement';
  quantite: number;
  stock_avant: number;
  stock_apres: number;
  reference: string | null;
  source_destination: string | null;
  motif: string | null;
  created_at: string;
}

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
