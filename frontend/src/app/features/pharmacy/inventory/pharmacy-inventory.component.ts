import { Component, signal, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import type { Produit } from '../models/pharmacy.models';

type Tab = 'stock' | 'seuils' | 'mouvements';

interface StockLine extends Produit { statut: 'ok' | 'alerte' | 'critique'; }
interface Mouvement { id: string; date: string; type: 'entree' | 'sortie'; quantite: number; reference: string; serviceFournisseur: string; }

@Component({
  selector: 'hm-pharmacy-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hm-page-header
      title="Inventaire"
      subtitle="Stock, seuils et historique des mouvements"
      icon="inventory_2">
    </hm-page-header>

    <!-- Tab switcher -->
    <div class="tab-bar">
      <button class="tab-btn" [class.active]="activeTab() === 'stock'"      (click)="setTab('stock')">Stock</button>
      <button class="tab-btn" [class.active]="activeTab() === 'seuils'"     (click)="setTab('seuils')">Seuils</button>
      <button class="tab-btn" [class.active]="activeTab() === 'mouvements'" (click)="setTab('mouvements')">Mouvements</button>
    </div>

    @if (loading()) {
      <hm-spinner label="Chargement..." />
    } @else {

      <!-- Stock tab -->
      @if (activeTab() === 'stock') {
        <div class="panel">
          <table class="data-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>DCI</th>
                <th>Stock actuel</th>
                <th>Seuil mini</th>
                <th>Seuil sécurité</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (p of stockLines(); track p.id) {
                <tr>
                  <td>{{ p.nomCommercial }}</td>
                  <td>{{ p.dciId }}</td>
                  <td>{{ p.stockActuel }}</td>
                  <td>{{ p.seuilMin }}</td>
                  <td>{{ p.seuilSecurite }}</td>
                  <td>
                    <span class="badge"
                      [class.badge--ok]="p.statut === 'ok'"
                      [class.badge--warn]="p.statut === 'alerte'"
                      [class.badge--danger]="p.statut === 'critique'">
                      {{ statutLabel(p.statut) }}
                    </span>
                  </td>
                  <td>
                    <button class="btn-icon" title="Ajuster le stock" (click)="openAdjust(p)">
                      <span class="material-icons">tune</span>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="empty-cell">Aucun produit en stock</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Seuils tab -->
      @if (activeTab() === 'seuils') {
        <div class="panel">
          <table class="data-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Seuil minimum</th>
                <th>Seuil sécurité</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (p of stockLines(); track p.id) {
                @if (editingSeuilId() === p.id) {
                  <tr class="editing-row">
                    <td>{{ p.nomCommercial }}</td>
                    <td><input class="input-qty" type="number" [(ngModel)]="editSeuilMin" min="0" /></td>
                    <td><input class="input-qty" type="number" [(ngModel)]="editSeuilSec" min="0" /></td>
                    <td class="actions-cell">
                      <button class="btn-icon" title="Enregistrer" (click)="saveSeuil(p)">
                        <span class="material-icons">check</span>
                      </button>
                      <button class="btn-icon" title="Annuler" (click)="cancelEdit()">
                        <span class="material-icons">close</span>
                      </button>
                    </td>
                  </tr>
                } @else {
                  <tr>
                    <td>{{ p.nomCommercial }}</td>
                    <td>{{ p.seuilMin }}</td>
                    <td>{{ p.seuilSecurite }}</td>
                    <td>
                      <button class="btn-icon" title="Modifier seuils" (click)="startEditSeuil(p)">
                        <span class="material-icons">edit</span>
                      </button>
                    </td>
                  </tr>
                }
              } @empty {
                <tr><td colspan="4" class="empty-cell">Aucun produit</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Mouvements tab -->
      @if (activeTab() === 'mouvements') {
        <div class="filter-row">
          <div class="search-box">
            <span class="material-icons">search</span>
            <input type="text" placeholder="Sélectionner un produit..." [(ngModel)]="mouvementFilter" (ngModelChange)="filterMouvements($event)" />
          </div>
        </div>

        <div class="panel">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Quantité</th>
                <th>Référence</th>
                <th>Service / Fournisseur</th>
              </tr>
            </thead>
            <tbody>
              @for (m of filteredMouvements(); track m.id) {
                <tr>
                  <td>{{ m.date }}</td>
                  <td>
                    <span class="badge"
                      [class.badge--ok]="m.type === 'entree'"
                      [class.badge--danger]="m.type === 'sortie'">
                      {{ m.type === 'entree' ? 'Entrée' : 'Sortie' }}
                    </span>
                  </td>
                  <td>{{ m.quantite }}</td>
                  <td><code class="mono">{{ m.reference }}</code></td>
                  <td>{{ m.serviceFournisseur }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty-cell">Aucun mouvement enregistré</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    }

    <!-- Adjust drawer -->
    @if (drawerOpen()) {
      <div class="drawer-backdrop" (click)="closeDrawer()"></div>
      <aside class="drawer">
        <div class="drawer-header">
          <span class="drawer-title">Ajuster le stock — {{ adjustTarget()?.nomCommercial }}</span>
          <button class="btn-icon" (click)="closeDrawer()"><span class="material-icons">close</span></button>
        </div>
        <div class="drawer-body">
          <div class="form-row">
            <label class="form-label">Nouveau stock</label>
            <input class="form-input" type="number" [(ngModel)]="newStockValue" min="0" />
          </div>
          <div class="form-actions">
            <button class="btn-secondary" (click)="closeDrawer()">Annuler</button>
            <button class="btn-primary" (click)="saveAdjust()">Enregistrer</button>
          </div>
        </div>
      </aside>
    }
  `,
  styles: [`
    .tab-bar {
      display: flex; gap: 4px; padding: 4px;
      background: var(--color-bg, #f8fafc); border-radius: var(--radius-md, 8px);
      width: fit-content; margin-bottom: 16px;
    }

    .tab-btn {
      padding: 8px 20px; border: none; background: transparent;
      border-radius: var(--radius-sm, 6px); font-size: 13px; font-weight: 600;
      color: var(--color-text-muted, #64748b); cursor: pointer; transition: all 0.15s;
    }

    .tab-btn.active {
      background: var(--color-surface, #fff); color: var(--color-text, #0f172a);
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }

    .panel {
      background: var(--color-surface, #fff); border-radius: var(--radius-lg, 14px);
      border: 1px solid var(--color-border, #e2e8f0); overflow: hidden;
    }

    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }

    .data-table th {
      text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.04em;
      color: var(--color-text-muted, #64748b); background: var(--color-bg, #f8fafc);
      border-bottom: 1px solid var(--color-border, #e2e8f0); white-space: nowrap;
    }

    .data-table td { padding: 10px 14px; border-bottom: 1px solid var(--color-border, #e2e8f0); color: var(--color-text, #0f172a); }
    .data-table tr:last-child td { border-bottom: none; }
    .editing-row td { background: rgba(0,188,212,0.03); }

    .empty-cell { text-align: center; color: var(--color-text-muted, #94a3b8); font-style: italic; padding: 32px; }

    .mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }

    .badge { display: inline-block; padding: 3px 9px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge--danger  { background: rgba(239,68,68,0.1);  color: #b91c1c; }
    .badge--warn    { background: rgba(245,158,11,0.1); color: #b45309; }
    .badge--ok      { background: rgba(34,197,94,0.1);  color: #15803d; }

    .actions-cell { display: flex; gap: 4px; align-items: center; }

    .btn-icon { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; background: transparent; border-radius: var(--radius-sm, 6px); cursor: pointer; color: var(--color-text-muted, #64748b); transition: background 0.15s; }
    .btn-icon:hover { background: var(--color-bg, #f8fafc); color: var(--color-text, #0f172a); }
    .btn-icon .material-icons { font-size: 18px; }

    .input-qty { width: 90px; height: 36px; padding: 0 8px; border: 1px solid var(--color-border, #e2e8f0); border-radius: var(--radius-sm, 6px); font-size: 13px; color: var(--color-text, #0f172a); outline: none; }
    .input-qty:focus { border-color: var(--color-primary, #00BCD4); }

    .filter-row { margin-bottom: 16px; }

    .search-box { display: flex; align-items: center; gap: 8px; padding: 0 12px; height: 40px; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #e2e8f0); border-radius: var(--radius-md, 8px); max-width: 360px; transition: border-color 0.15s; }
    .search-box:focus-within { border-color: var(--color-primary, #00BCD4); }
    .search-box .material-icons { font-size: 18px; color: var(--color-text-muted, #64748b); }
    .search-box input { flex: 1; border: none; background: transparent; font-size: 13px; color: var(--color-text, #0f172a); outline: none; }

    /* Drawer */
    .drawer-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 200; }
    .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 480px; background: var(--color-surface, #fff); border-left: 1px solid var(--color-border, #e2e8f0); z-index: 201; display: flex; flex-direction: column; }
    .drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--color-border, #e2e8f0); }
    .drawer-title { font-size: 16px; font-weight: 700; color: var(--color-text, #0f172a); }
    .drawer-body { flex: 1; overflow-y: auto; padding: 20px; }

    .form-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .form-label { font-size: 12px; font-weight: 600; color: var(--color-text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.04em; }
    .form-input { height: 40px; padding: 0 12px; border: 1px solid var(--color-border, #e2e8f0); border-radius: var(--radius-md, 8px); font-size: 13px; color: var(--color-text, #0f172a); background: var(--color-surface, #fff); outline: none; transition: border-color 0.15s; }
    .form-input:focus { border-color: var(--color-primary, #00BCD4); }

    .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--color-border, #e2e8f0); }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--color-primary, #00BCD4); color: #fff; border: none; border-radius: var(--radius-md, 8px); padding: 10px 20px; font-size: 13px; font-weight: 700; cursor: pointer; }
    .btn-primary:hover { background: #0097a7; }
    .btn-secondary { display: inline-flex; align-items: center; gap: 6px; background: var(--color-surface, #fff); color: var(--color-text-muted, #64748b); border: 1px solid var(--color-border, #e2e8f0); border-radius: var(--radius-md, 8px); padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-secondary:hover { background: var(--color-bg, #f8fafc); }
  `],
})
export class PharmacyInventoryComponent implements OnInit {
  private http = inject(HttpClient);

  activeTab       = signal<Tab>('stock');
  loading         = signal(true);
  drawerOpen      = signal(false);
  adjustTarget    = signal<StockLine | null>(null);
  editingSeuilId  = signal<string | null>(null);
  newStockValue   = 0;
  editSeuilMin    = 0;
  editSeuilSec    = 0;
  mouvementFilter = '';

  stockLines       = signal<StockLine[]>([]);
  allMouvements    = signal<Mouvement[]>([]);
  filteredMouvements = signal<Mouvement[]>([]);

  ngOnInit(): void {
    this.http.get<any>(`${environment.baseUrl}/pharmacy/inventaire`).subscribe({
      next: (data) => {
        const raw: Produit[] = data.produits ?? [];
        this.stockLines.set(raw.map(p => ({ ...p, statut: this.calcStatut(p) })));
        const mvts: Mouvement[] = data.mouvements ?? [];
        this.allMouvements.set(mvts);
        this.filteredMouvements.set(mvts);
        this.loading.set(false);
      },
      error: () => {
        this.stockLines.set([]);
        this.allMouvements.set([]);
        this.filteredMouvements.set([]);
        this.loading.set(false);
      },
    });
  }

  private calcStatut(p: Produit): 'ok' | 'alerte' | 'critique' {
    if (p.stockActuel <= p.seuilMin) return 'critique';
    if (p.stockActuel <= p.seuilSecurite) return 'alerte';
    return 'ok';
  }

  setTab(tab: Tab): void { this.activeTab.set(tab); }

  statutLabel(s: string): string {
    return s === 'ok' ? 'OK' : s === 'alerte' ? 'Alerte' : 'Critique';
  }

  openAdjust(p: StockLine): void {
    this.adjustTarget.set(p);
    this.newStockValue = p.stockActuel;
    this.drawerOpen.set(true);
  }

  saveAdjust(): void {
    const t = this.adjustTarget();
    if (!t) return;
    this.stockLines.update(lines =>
      lines.map(l => l.id === t.id
        ? { ...l, stockActuel: this.newStockValue, statut: this.calcStatut({ ...l, stockActuel: this.newStockValue }) }
        : l
      )
    );
    this.closeDrawer();
  }

  startEditSeuil(p: StockLine): void {
    this.editingSeuilId.set(p.id);
    this.editSeuilMin = p.seuilMin;
    this.editSeuilSec = p.seuilSecurite;
  }

  saveSeuil(p: StockLine): void {
    this.stockLines.update(lines =>
      lines.map(l => l.id === p.id
        ? { ...l, seuilMin: this.editSeuilMin, seuilSecurite: this.editSeuilSec, statut: this.calcStatut({ ...l, seuilMin: this.editSeuilMin, seuilSecurite: this.editSeuilSec }) }
        : l
      )
    );
    this.editingSeuilId.set(null);
  }

  cancelEdit(): void { this.editingSeuilId.set(null); }

  filterMouvements(q: string): void {
    const lq = q.toLowerCase();
    this.filteredMouvements.set(
      !lq ? this.allMouvements() : this.allMouvements().filter(m =>
        m.reference.toLowerCase().includes(lq) || m.serviceFournisseur.toLowerCase().includes(lq)
      )
    );
  }

  closeDrawer(): void { this.drawerOpen.set(false); }
}
