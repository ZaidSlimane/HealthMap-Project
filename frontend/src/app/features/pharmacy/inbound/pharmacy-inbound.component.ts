import { Component, signal, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import type { Commande } from '../models/pharmacy.models';

type Tab = 'commandes' | 'reception';
type StatusFilter = 'toutes' | 'en_attente' | 'confirmee' | 'recue';

@Component({
  selector: 'hm-pharmacy-inbound',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hm-page-header
      title="Approvisionnement"
      subtitle="Commandes fournisseurs et réception des livraisons"
      icon="local_shipping">
      @if (activeTab() === 'commandes') {
        <button class="btn-add" (click)="openCreate()">
          <span class="material-icons">add</span>
          Nouvelle commande
        </button>
      }
    </hm-page-header>

    <!-- Tab switcher -->
    <div class="tab-bar">
      <button class="tab-btn" [class.active]="activeTab() === 'commandes'" (click)="setTab('commandes')">Commandes</button>
      <button class="tab-btn" [class.active]="activeTab() === 'reception'" (click)="setTab('reception')">Réception</button>
    </div>

    @if (loading()) {
      <hm-spinner label="Chargement..." />
    } @else {
      <!-- Commandes tab -->
      @if (activeTab() === 'commandes') {
        <div class="filter-bar">
          @for (f of statusFilters; track f.value) {
            <button class="filter-chip" [class.active]="statusFilter() === f.value" (click)="setStatusFilter(f.value)">
              {{ f.label }}
            </button>
          }
        </div>

        <div class="panel">
          <table class="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Fournisseur</th>
                <th>Date commande</th>
                <th>Nb produits</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (cmd of filteredCommandes(); track cmd.id) {
                <tr>
                  <td><code class="mono">{{ cmd.reference }}</code></td>
                  <td>{{ cmd.fournisseurId }}</td>
                  <td>{{ cmd.dateCommande }}</td>
                  <td>{{ cmd.lignes?.length ?? 0 }}</td>
                  <td>
                    <span class="badge" [class]="statusClass(cmd.statut)">
                      {{ statusLabel(cmd.statut) }}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <button class="btn-icon" title="Voir détail" (click)="viewDetail(cmd)">
                      <span class="material-icons">visibility</span>
                    </button>
                    @if (cmd.statut !== 'recue') {
                      <button class="btn-icon" title="Confirmer réception" (click)="startReception(cmd)">
                        <span class="material-icons">check_circle</span>
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty-cell">Aucune commande trouvée</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Réception tab -->
      @if (activeTab() === 'reception') {
        @if (!selectedCommande()) {
          <div class="empty-state">
            <span class="material-icons">inbox</span>
            <h3>Aucune commande sélectionnée</h3>
            <p>Sélectionnez une commande dans l'onglet "Commandes" pour démarrer la réception.</p>
          </div>
        } @else {
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Bon de livraison — {{ selectedCommande()!.reference }}</span>
              <button class="btn-icon" (click)="selectedCommande.set(null)">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="reception-form">
              <div class="form-row">
                <label class="form-label">Référence commande</label>
                <input class="form-input" [value]="selectedCommande()!.reference" disabled />
              </div>
              <div class="form-row">
                <label class="form-label">Date de livraison</label>
                <input class="form-input" type="date" [(ngModel)]="deliveryDate" />
              </div>
              <table class="data-table" style="margin-top:16px">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Qté commandée</th>
                    <th>Qté reçue</th>
                    <th>N° lot</th>
                    <th>Date expiration</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ligne of selectedCommande()!.lignes ?? []; track ligne.produitId) {
                    <tr>
                      <td>{{ ligne.produitId }}</td>
                      <td>{{ ligne.qteCommandee }}</td>
                      <td><input class="input-qty" type="number" [(ngModel)]="ligne.qteRecue" min="0" /></td>
                      <td><input class="form-input" [(ngModel)]="ligne.lot" /></td>
                      <td><input class="form-input" type="date" [(ngModel)]="ligne.dateExpiration" /></td>
                    </tr>
                  }
                </tbody>
              </table>
              <div class="form-actions">
                <button class="btn-secondary" (click)="selectedCommande.set(null)">Annuler</button>
                <button class="btn-primary" (click)="validateReception()">Valider la réception</button>
              </div>
            </div>
          </div>
        }
      }
    }

    <!-- Create drawer -->
    @if (drawerOpen()) {
      <div class="drawer-backdrop" (click)="closeDrawer()"></div>
      <aside class="drawer">
        <div class="drawer-header">
          <span class="drawer-title">Nouvelle commande</span>
          <button class="btn-icon" (click)="closeDrawer()">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="drawer-body">
          <p class="coming-soon-note">Formulaire en cours de développement.</p>
        </div>
      </aside>
    }
  `,
  styles: [`
    .tab-bar {
      display: flex;
      gap: 4px;
      padding: 4px;
      background: var(--color-bg, #f8fafc);
      border-radius: var(--radius-md, 8px);
      width: fit-content;
      margin-bottom: 16px;
    }

    .tab-btn {
      padding: 8px 20px;
      border: none;
      background: transparent;
      border-radius: var(--radius-sm, 6px);
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-muted, #64748b);
      cursor: pointer;
      transition: all 0.15s;
    }

    .tab-btn.active {
      background: var(--color-surface, #fff);
      color: var(--color-text, #0f172a);
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }

    .filter-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .filter-chip {
      padding: 6px 14px;
      border: 1px solid var(--color-border, #e2e8f0);
      background: var(--color-surface, #fff);
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-muted, #64748b);
      cursor: pointer;
      transition: all 0.15s;
    }

    .filter-chip.active {
      background: var(--color-primary, #00BCD4);
      border-color: var(--color-primary, #00BCD4);
      color: #fff;
    }

    .panel {
      background: var(--color-surface, #fff);
      border-radius: var(--radius-lg, 14px);
      border: 1px solid var(--color-border, #e2e8f0);
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid var(--color-border, #e2e8f0);
    }

    .panel-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .data-table th {
      text-align: left;
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-text-muted, #64748b);
      background: var(--color-bg, #f8fafc);
      border-bottom: 1px solid var(--color-border, #e2e8f0);
      white-space: nowrap;
    }

    .data-table td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--color-border, #e2e8f0);
      color: var(--color-text, #0f172a);
    }

    .data-table tr:last-child td { border-bottom: none; }

    .empty-cell {
      text-align: center;
      color: var(--color-text-muted, #94a3b8);
      font-style: italic;
      padding: 32px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 60px 20px;
      text-align: center;
      color: var(--color-text-muted, #64748b);
      background: var(--color-surface, #fff);
      border-radius: var(--radius-xl, 14px);
      box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    }

    .empty-state .material-icons { font-size: 48px; color: #cbd5e1; }
    .empty-state h3 { margin: 0; color: var(--color-text, #0f172a); }
    .empty-state p  { margin: 0; font-size: 14px; max-width: 400px; }

    .mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }

    .badge {
      display: inline-block;
      padding: 3px 9px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }

    .badge--warn    { background: rgba(245,158,11,0.1); color: #b45309; }
    .badge--info    { background: rgba(59,130,246,0.1); color: #1d4ed8; }
    .badge--ok      { background: rgba(34,197,94,0.1);  color: #15803d; }

    .actions-cell { display: flex; gap: 4px; align-items: center; }

    .btn-icon {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border: none; background: transparent;
      border-radius: var(--radius-sm, 6px); cursor: pointer;
      color: var(--color-text-muted, #64748b); transition: background 0.15s, color 0.15s;
    }

    .btn-icon:hover { background: var(--color-bg, #f8fafc); color: var(--color-text, #0f172a); }
    .btn-icon .material-icons { font-size: 18px; }

    .btn-add {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--color-primary, #00BCD4); color: #fff; border: none;
      border-radius: var(--radius-md, 8px); padding: 10px 18px;
      font-size: 13px; font-weight: 700; cursor: pointer;
    }

    .btn-add:hover { background: #0097a7; }
    .btn-add .material-icons { font-size: 18px; }

    /* Reception form */
    .reception-form { padding: 20px; }
    .form-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .form-label { font-size: 12px; font-weight: 600; color: var(--color-text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.04em; }

    .form-input {
      height: 40px; padding: 0 12px; border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 8px); font-size: 13px;
      color: var(--color-text, #0f172a); background: var(--color-surface, #fff);
      outline: none; transition: border-color 0.15s;
    }

    .form-input:focus { border-color: var(--color-primary, #00BCD4); }
    .form-input:disabled { background: var(--color-bg, #f8fafc); cursor: default; }

    .input-qty {
      width: 80px; height: 36px; padding: 0 8px;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-sm, 6px); font-size: 13px;
      color: var(--color-text, #0f172a); outline: none;
    }

    .input-qty:focus { border-color: var(--color-primary, #00BCD4); }

    .form-actions {
      display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;
      padding-top: 16px; border-top: 1px solid var(--color-border, #e2e8f0);
    }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--color-primary, #00BCD4); color: #fff; border: none;
      border-radius: var(--radius-md, 8px); padding: 10px 20px;
      font-size: 13px; font-weight: 700; cursor: pointer;
    }

    .btn-primary:hover { background: #0097a7; }

    .btn-secondary {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--color-surface, #fff); color: var(--color-text-muted, #64748b);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 8px); padding: 10px 20px;
      font-size: 13px; font-weight: 600; cursor: pointer;
    }

    .btn-secondary:hover { background: var(--color-bg, #f8fafc); }

    /* Slide-over */
    .drawer-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 200; }
    .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 480px; background: var(--color-surface, #fff); border-left: 1px solid var(--color-border, #e2e8f0); z-index: 201; display: flex; flex-direction: column; }
    .drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--color-border, #e2e8f0); }
    .drawer-title { font-size: 16px; font-weight: 700; color: var(--color-text, #0f172a); }
    .drawer-body { flex: 1; overflow-y: auto; padding: 20px; }
    .coming-soon-note { color: var(--color-text-muted, #64748b); font-style: italic; }
  `],
})
export class PharmacyInboundComponent implements OnInit {
  private http = inject(HttpClient);

  activeTab      = signal<Tab>('commandes');
  statusFilter   = signal<StatusFilter>('toutes');
  loading        = signal(true);
  drawerOpen     = signal(false);
  commandes      = signal<Commande[]>([]);
  filteredCommandes = signal<Commande[]>([]);
  selectedCommande  = signal<Commande | null>(null);
  deliveryDate   = '';

  statusFilters = [
    { label: 'Toutes',      value: 'toutes'     as StatusFilter },
    { label: 'En attente',  value: 'en_attente' as StatusFilter },
    { label: 'Confirmée',   value: 'confirmee'  as StatusFilter },
    { label: 'Reçue',       value: 'recue'      as StatusFilter },
  ];

  ngOnInit(): void {
    this.http.get<any>(`${environment.baseUrl}/pharmacy/commandes`).subscribe({
      next: (data) => {
        this.commandes.set(data.data ?? []);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => {
        this.commandes.set([]);
        this.applyFilter();
        this.loading.set(false);
      },
    });
  }

  setTab(tab: Tab): void { this.activeTab.set(tab); }

  setStatusFilter(f: StatusFilter): void {
    this.statusFilter.set(f);
    this.applyFilter();
  }

  private applyFilter(): void {
    const sf = this.statusFilter();
    this.filteredCommandes.set(
      sf === 'toutes' ? this.commandes() : this.commandes().filter(c => c.statut === sf)
    );
  }

  viewDetail(cmd: Commande): void {
    this.selectedCommande.set(cmd);
    this.setTab('reception');
  }

  startReception(cmd: Commande): void {
    this.selectedCommande.set({ ...cmd, lignes: cmd.lignes?.map(l => ({ ...l, qteRecue: l.qteCommandee })) ?? [] });
    this.deliveryDate = new Date().toISOString().slice(0, 10);
    this.setTab('reception');
  }

  validateReception(): void {
    // TODO: POST to backend
    alert('Réception validée (à connecter au backend).');
    this.selectedCommande.set(null);
    this.setTab('commandes');
  }

  openCreate(): void { this.drawerOpen.set(true); }
  closeDrawer(): void { this.drawerOpen.set(false); }

  statusLabel(s: string): string {
    const map: Record<string, string> = { en_attente: 'En attente', confirmee: 'Confirmée', recue: 'Reçue' };
    return map[s] ?? s;
  }

  statusClass(s: string): string {
    const map: Record<string, string> = { en_attente: 'badge badge--warn', confirmee: 'badge badge--info', recue: 'badge badge--ok' };
    return map[s] ?? 'badge';
  }
}
