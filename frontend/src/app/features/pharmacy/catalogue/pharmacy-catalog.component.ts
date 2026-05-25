import { Component, signal, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import type { Dci, Produit, Fournisseur } from '../models/pharmacy.models';

type Tab = 'dci' | 'produits' | 'fournisseurs';
type DrawerMode = 'create-dci' | 'edit-dci' | 'create-produit' | 'edit-produit' | 'create-fournisseur' | 'edit-fournisseur' | null;

interface NatResult {
  nat_id: number;
  denomination: string;
  classification: 'nationale' | 'orse' | 'strategique';
  classe_therapeutique: string | null;
  suggested_type: 'local' | 'orse' | 'strategique';
  already_local: boolean;
}

@Component({
  selector: 'hm-pharmacy-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pharmacy-catalog.component.html',
  styleUrl: './pharmacy-catalog.component.scss',
})
export class PharmacyCatalogComponent implements OnInit {
  private http = inject(HttpClient);

  // ── State ──────────────────────────────────────────────────────────────────
  activeTab   = signal<Tab>('dci');
  loading     = signal(true);
  saving      = signal(false);
  searchQuery = '';
  drawerMode  = signal<DrawerMode>(null);

  // DCI list (paginated from server)
  dciList          = signal<Dci[]>([]);
  dciPage          = signal(1);
  dciTotal         = signal(0);
  dciPerPage       = 20;

  produitsList     = signal<Produit[]>([]);
  fournisseursList = signal<Fournisseur[]>([]);

  filteredDci          = signal<Dci[]>([]);
  filteredProduits     = signal<Produit[]>([]);
  filteredFournisseurs = signal<Fournisseur[]>([]);

  // DCI form
  dciForm = signal({
    id: '',
    code: '',
    denomination: '',
    classification: 'nationale' as 'nationale' | 'orse' | 'strategique',
    classeTherapeutique: '',
    type: 'local' as 'local' | 'orse' | 'strategique',
    seuilMin: 10,
    seuilSecurite: 20,
    pointCommande: 0,
    prixDefaut: '',
  });

  // National list search
  natQuery$      = new Subject<string>();
  natQuery       = signal('');
  natResults     = signal<NatResult[]>([]);
  natSearching   = signal(false);
  natPicked      = signal<NatResult | null>(null);

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadDci();
    this.loadProduits();
    this.loadFournisseurs();
    this.setupNatSearch();
  }

  private setupNatSearch(): void {
    this.natQuery$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 2) { this.natResults.set([]); this.natSearching.set(false); return of([]); }
        this.natSearching.set(true);
        return this.http.get<NatResult[]>(`${environment.baseUrl}/pharmacy/dci/search-national`, {
          params: new HttpParams().set('q', q),
        });
      }),
    ).subscribe({
      next: (res) => { this.natResults.set(res); this.natSearching.set(false); },
      error: () => { this.natResults.set([]); this.natSearching.set(false); },
    });
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  loadDci(page = 1, search = ''): void {
    this.loading.set(true);
    let params = new HttpParams().set('per_page', this.dciPerPage).set('page', page);
    if (search) params = params.set('search', search);
    this.http.get<any>(`${environment.baseUrl}/pharmacy/dci`, { params }).subscribe({
      next: (res) => {
        const items: Dci[] = (res.data ?? res).map((d: any) => ({
          id: String(d.id),
          code: d.code,
          denomination: d.denomination,
          classification: d.classification,
          classeTherapeutique: d.classe_therapeutique ?? '',
        }));
        this.dciList.set(items);
        this.filteredDci.set(items);
        this.dciTotal.set(res.total ?? items.length);
        this.dciPage.set(page);
        this.loading.set(false);
      },
      error: () => { this.dciList.set([]); this.filteredDci.set([]); this.loading.set(false); },
    });
  }

  private loadProduits(): void {
    this.http.get<any>(`${environment.baseUrl}/pharmacy/produits?per_page=100`).subscribe({
      next: (res) => {
        const items: Produit[] = (res.data ?? res).map((p: any) => ({
          id: String(p.id), codeNomenclature: p.code_nomenclature,
          nomCommercial: p.nom_commercial, dciId: String(p.dci_id ?? ''),
          fournisseurId: String(p.fournisseur_id ?? ''), forme: p.forme ?? '',
          dosage: p.dosage ?? '', stockActuel: p.stock_actuel,
          seuilMin: p.seuil_min, seuilSecurite: p.seuil_securite,
        }));
        this.produitsList.set(items);
        this.filteredProduits.set(items);
      },
      error: () => { this.produitsList.set([]); this.filteredProduits.set([]); },
    });
  }

  private loadFournisseurs(): void {
    this.http.get<any>(`${environment.baseUrl}/pharmacy/fournisseurs?per_page=100`).subscribe({
      next: (res) => {
        const items: Fournisseur[] = (res.data ?? res).map((f: any) => ({
          id: String(f.id), nom: f.nom, type: f.type, contact: f.contact ?? '',
        }));
        this.fournisseursList.set(items);
        this.filteredFournisseurs.set(items);
      },
      error: () => { this.fournisseursList.set([]); this.filteredFournisseurs.set([]); },
    });
  }

  // ── Tab & search ──────────────────────────────────────────────────────────

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    this.searchQuery = '';
    if (tab === 'dci') { this.loadDci(1, ''); }
  }

  onSearch(q: string): void {
    if (this.activeTab() === 'dci') {
      this.loadDci(1, q);
    } else {
      const lq = q.toLowerCase();
      this.filteredProduits.set(this.produitsList().filter(p =>
        !lq || p.nomCommercial.toLowerCase().includes(lq) || p.codeNomenclature.toLowerCase().includes(lq)));
      this.filteredFournisseurs.set(this.fournisseursList().filter(f =>
        !lq || f.nom.toLowerCase().includes(lq)));
    }
  }

  dciPrevPage(): void  { if (this.dciPage() > 1) this.loadDci(this.dciPage() - 1, this.searchQuery); }
  dciNextPage(): void  { if (this.dciPage() * this.dciPerPage < this.dciTotal()) this.loadDci(this.dciPage() + 1, this.searchQuery); }
  get dciHasPrev(): boolean { return this.dciPage() > 1; }
  get dciHasNext(): boolean { return this.dciPage() * this.dciPerPage < this.dciTotal(); }

  // ── Drawer open/close ─────────────────────────────────────────────────────

  openCreateDci(): void {
    this.dciForm.set({ id: '', code: '', denomination: '', classification: 'nationale', classeTherapeutique: '', type: 'local', seuilMin: 10, seuilSecurite: 20, pointCommande: 0, prixDefaut: '' });
    this.natQuery.set(''); this.natResults.set([]); this.natPicked.set(null);
    this.drawerMode.set('create-dci');
  }

  openEditDci(d: Dci): void {
    this.dciForm.set({ id: d.id, code: d.code, denomination: d.denomination, classification: d.classification, classeTherapeutique: d.classeTherapeutique, type: (d as any).type ?? 'local', seuilMin: (d as any).seuilMin ?? 0, seuilSecurite: (d as any).seuilSecurite ?? 0, pointCommande: 0, prixDefaut: '' });
    this.natPicked.set(null); this.natResults.set([]);
    this.drawerMode.set('edit-dci');
  }

  closeDrawer(): void { this.drawerMode.set(null); }

  // ── National list pick ────────────────────────────────────────────────────

  onNatQueryChange(q: string): void {
    this.natQuery.set(q);
    this.natQuery$.next(q);
  }

  pickNatResult(r: NatResult): void {
    this.natPicked.set(r);
    this.natResults.set([]);
    this.dciForm.update(f => ({
      ...f,
      denomination:         r.denomination,
      classification:       r.classification,
      classeTherapeutique:  r.classe_therapeutique ?? '',
      type:                 r.suggested_type,
      code: f.code || ('NAT' + String(r.nat_id).padStart(6, '0')),
    }));
  }

  clearNatPick(): void {
    this.natPicked.set(null);
    this.natQuery.set('');
    this.dciForm.update(f => ({ ...f, denomination: '', classification: 'nationale', classeTherapeutique: '', code: '' }));
  }

  // ── Save DCI ──────────────────────────────────────────────────────────────

  saveDci(): void {
    const f = this.dciForm();
    if (!f.denomination.trim()) { alert('La dénomination est obligatoire.'); return; }

    const payload = {
      code:                 f.code.trim() || ('DCI' + Date.now()),
      denomination:         f.denomination.trim(),
      type:                 f.type,
      classification:       f.classification,
      classe_therapeutique: f.classeTherapeutique || null,
      seuil_min:            f.seuilMin,
      seuil_securite:       f.seuilSecurite,
      point_commande:       f.pointCommande,
      prix_defaut:          f.prixDefaut ? +f.prixDefaut : null,
    };

    this.saving.set(true);
    const req = f.id
      ? this.http.put(`${environment.baseUrl}/pharmacy/dci/${f.id}`, payload)
      : this.http.post(`${environment.baseUrl}/pharmacy/dci`, payload);

    req.subscribe({
      next: () => { this.saving.set(false); this.closeDrawer(); this.loadDci(this.dciPage(), this.searchQuery); },
      error: (err) => { this.saving.set(false); alert(err?.error?.message ?? 'Erreur lors de la sauvegarde.'); },
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  deleteDci(id: string): void {
    if (!confirm('Supprimer cette DCI ? Cette action est irréversible.')) return;
    this.http.delete(`${environment.baseUrl}/pharmacy/dci/${id}`).subscribe({
      next: () => this.loadDci(this.dciPage(), this.searchQuery),
      error: (err) => alert(err?.error?.message ?? 'Erreur lors de la suppression.'),
    });
  }

  deleteProduit(id: string): void {
    if (!confirm('Supprimer ce produit ?')) return;
    this.http.delete(`${environment.baseUrl}/pharmacy/produits/${id}`).subscribe({
      next: () => this.loadProduits(),
    });
  }

  deleteFournisseur(id: string): void {
    if (!confirm('Supprimer ce fournisseur ?')) return;
    this.http.delete(`${environment.baseUrl}/pharmacy/fournisseurs/${id}`).subscribe({
      next: () => this.loadFournisseurs(),
    });
  }

  // ── Form field patchers (called from template — arrow fns not allowed in templates) ──
  patchCode(v: string):              void { this.dciForm.update(f => ({...f, code: v})); }
  patchDenomination(v: string):      void { this.dciForm.update(f => ({...f, denomination: v})); }
  patchClassification(v: string):    void { this.dciForm.update(f => ({...f, classification: v as any})); }
  patchType(v: string):              void { this.dciForm.update(f => ({...f, type: v as any})); }
  patchClasseTherapeutique(v: string): void { this.dciForm.update(f => ({...f, classeTherapeutique: v})); }
  patchSeuilMin(v: string):          void { this.dciForm.update(f => ({...f, seuilMin: +v})); }
  patchSeuilSecurite(v: string):     void { this.dciForm.update(f => ({...f, seuilSecurite: +v})); }
  patchPointCommande(v: string):     void { this.dciForm.update(f => ({...f, pointCommande: +v})); }
  patchPrixDefaut(v: string):        void { this.dciForm.update(f => ({...f, prixDefaut: v})); }

  // ── Stubs for produits/fournisseurs drawers ───────────────────────────────

  openCreate(): void {
    if (this.activeTab() === 'dci')          { this.openCreateDci(); return; }
    if (this.activeTab() === 'produits')     { this.drawerMode.set('create-produit'); }
    if (this.activeTab() === 'fournisseurs') { this.drawerMode.set('create-fournisseur'); }
  }

  editProduit(_p: Produit): void      { this.drawerMode.set('edit-produit'); }
  editFournisseur(_f: Fournisseur): void { this.drawerMode.set('edit-fournisseur'); }

  // ── Display helpers ───────────────────────────────────────────────────────

  drawerTitle(): string {
    const map: Record<string, string> = {
      'create-dci': 'Ajouter une DCI',
      'edit-dci':   'Modifier la DCI',
      'create-produit': 'Nouveau produit',
      'edit-produit':   'Modifier le produit',
      'create-fournisseur': 'Nouveau fournisseur',
      'edit-fournisseur':   'Modifier le fournisseur',
    };
    return map[this.drawerMode() ?? ''] ?? '';
  }

  addBtnLabel(): string {
    if (this.activeTab() === 'dci')          return 'Nouvelle DCI';
    if (this.activeTab() === 'produits')     return 'Nouveau produit';
    return 'Nouveau fournisseur';
  }

  searchPlaceholder(): string {
    if (this.activeTab() === 'dci')          return 'Rechercher une DCI...';
    if (this.activeTab() === 'produits')     return 'Rechercher un produit...';
    return 'Rechercher un fournisseur...';
  }

  dciName(id: string): string {
    return this.dciList().find(d => d.id === id)?.denomination ?? '—';
  }

  fournisseurName(id: string): string {
    return this.fournisseursList().find(f => f.id === id)?.nom ?? '—';
  }

  classifLabel(c: string): string {
    return ({ nationale: 'Nationale', orse: 'ORSE', strategique: 'Stratégique' } as any)[c] ?? c;
  }

  classifClass(c: string): string { return `badge badge--${c}`; }

  typeLabel(t: string): string {
    return ({ local: 'Local', orse: 'ORSE', strategique: 'Stratégique' } as any)[t] ?? t;
  }

  typeBadgeClass(t: string): string {
    const map: Record<string, string> = {
      local: 'badge--local',
      orse: 'badge--orse',
      strategique: 'badge--strategique',
    };
    return `badge ${map[t] ?? 'badge--local'}`;
  }

  /** Safe accessor for DCI type — avoids 'as any' in templates */
  getDciType(item: Dci): string {
    return (item as any).type ?? 'local';
  }

  get dciRangeStart(): number { return (this.dciPage() - 1) * this.dciPerPage + 1; }
  get dciRangeEnd(): number   { return Math.min(this.dciPage() * this.dciPerPage, this.dciTotal()); }
}
