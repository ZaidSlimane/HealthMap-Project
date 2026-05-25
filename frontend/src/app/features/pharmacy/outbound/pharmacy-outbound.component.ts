import { Component, signal, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';

type Tab = 'dotations' | 'dispensation' | 'exceptionnelles';

interface Dotation { serviceId: string; serviceName: string; produit: string; type: string; qteAllouee: number; }
interface BonDispensation { id: string; reference: string; service: string; produits: string; dateDemande: string; statut: string; }

@Component({
  selector: 'hm-pharmacy-outbound',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hm-page-header
      title="Distribution"
      subtitle="Dotations, dispensation et livraisons exceptionnelles"
      icon="send">
    </hm-page-header>

    <!-- Tab switcher -->
    <div class="tab-bar">
      <button class="tab-btn" [class.active]="activeTab() === 'dotations'"    (click)="setTab('dotations')">Dotations</button>
      <button class="tab-btn" [class.active]="activeTab() === 'dispensation'" (click)="setTab('dispensation')">Dispensation</button>
      <button class="tab-btn" [class.active]="activeTab() === 'exceptionnelles'" (click)="setTab('exceptionnelles')">Exceptionnelles</button>
    </div>

    @if (loading()) {
      <hm-spinner label="Chargement..." />
    } @else {

      <!-- Dotations -->
      @if (activeTab() === 'dotations') {
        <div class="two-col">
          <div class="panel">
            <div class="panel-header"><span class="panel-title">Services</span></div>
            <ul class="service-list">
              @for (s of services(); track s.id) {
                <li class="service-item" [class.active]="selectedServiceId() === s.id" (click)="selectService(s.id)">
                  <span class="material-icons">local_hospital</span>
                  {{ s.name }}
                </li>
              } @empty {
                <li class="empty-cell">Aucun service</li>
              }
            </ul>
          </div>

          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Stock alloué{{ selectedServiceName() ? ' — ' + selectedServiceName() : '' }}</span>
            </div>
            @if (!selectedServiceId()) {
              <p class="empty-cell">Sélectionnez un service</p>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Type</th>
                    <th>Qté allouée</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (d of serviceDotations(); track d.produit) {
                    <tr>
                      <td>{{ d.produit }}</td>
                      <td>
                        <span class="badge badge--info">{{ d.type }}</span>
                      </td>
                      <td>{{ d.qteAllouee }}</td>
                      <td>
                        <button class="btn-icon" title="Modifier">
                          <span class="material-icons">edit</span>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="4" class="empty-cell">Aucune dotation</td></tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>
      }

      <!-- Dispensation / Exceptionnelles (same pattern) -->
      @if (activeTab() === 'dispensation' || activeTab() === 'exceptionnelles') {
        <div class="filter-row">
          <div class="search-box">
            <span class="material-icons">search</span>
            <input type="text" placeholder="Rechercher un bon..." [(ngModel)]="searchQuery" />
          </div>
        </div>

        <div class="panel">
          <table class="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Service</th>
                <th>Produits</th>
                <th>Date demande</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (bon of filteredBons(); track bon.id) {
                <tr>
                  <td><code class="mono">{{ bon.reference }}</code></td>
                  <td>{{ bon.service }}</td>
                  <td>{{ bon.produits }}</td>
                  <td>{{ bon.dateDemande }}</td>
                  <td>
                    <span class="badge" [class.badge--warn]="bon.statut === 'en_attente'" [class.badge--ok]="bon.statut === 'dispensee'">
                      {{ bon.statut === 'en_attente' ? 'En attente' : 'Dispensée' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn-icon" title="Dispenser" (click)="openDispense(bon)">
                      <span class="material-icons">check</span>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty-cell">Aucun bon trouvé</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    }

    <!-- Dispense drawer -->
    @if (drawerOpen()) {
      <div class="drawer-backdrop" (click)="closeDrawer()"></div>
      <aside class="drawer">
        <div class="drawer-header">
          <span class="drawer-title">Dispenser — {{ dispenseTarget()?.reference }}</span>
          <button class="btn-icon" (click)="closeDrawer()"><span class="material-icons">close</span></button>
        </div>
        <div class="drawer-body">
          <p class="coming-soon-note">Formulaire de dispensation en cours de développement.</p>
          <div class="form-actions">
            <button class="btn-secondary" (click)="closeDrawer()">Annuler</button>
            <button class="btn-primary" (click)="confirmDispense()">Confirmer</button>
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

    .two-col { display: grid; grid-template-columns: 280px 1fr; gap: 16px; }

    .panel {
      background: var(--color-surface, #fff);
      border-radius: var(--radius-lg, 14px);
      border: 1px solid var(--color-border, #e2e8f0);
      overflow: hidden;
    }

    .panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-bottom: 1px solid var(--color-border, #e2e8f0);
    }

    .panel-title { font-size: 14px; font-weight: 600; color: var(--color-text, #0f172a); }

    .service-list { list-style: none; margin: 0; padding: 8px; }

    .service-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: var(--radius-sm, 6px);
      font-size: 13px; font-weight: 500; color: var(--color-text, #0f172a);
      cursor: pointer; transition: background 0.15s;
    }

    .service-item:hover { background: var(--color-bg, #f8fafc); }

    .service-item.active {
      background: rgba(0, 188, 212, 0.08);
      color: var(--color-primary, #00BCD4);
      font-weight: 600;
    }

    .service-item .material-icons { font-size: 18px; }

    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table th {
      text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.04em;
      color: var(--color-text-muted, #64748b); background: var(--color-bg, #f8fafc);
      border-bottom: 1px solid var(--color-border, #e2e8f0); white-space: nowrap;
    }
    .data-table td { padding: 10px 14px; border-bottom: 1px solid var(--color-border, #e2e8f0); color: var(--color-text, #0f172a); }
    .data-table tr:last-child td { border-bottom: none; }

    .empty-cell { text-align: center; color: var(--color-text-muted, #94a3b8); font-style: italic; padding: 32px; }

    .mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }

    .badge { display: inline-block; padding: 3px 9px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge--warn  { background: rgba(245,158,11,0.1); color: #b45309; }
    .badge--info  { background: rgba(59,130,246,0.1); color: #1d4ed8; }
    .badge--ok    { background: rgba(34,197,94,0.1);  color: #15803d; }

    .btn-icon { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; background: transparent; border-radius: var(--radius-sm, 6px); cursor: pointer; color: var(--color-text-muted, #64748b); transition: background 0.15s; }
    .btn-icon:hover { background: var(--color-bg, #f8fafc); color: var(--color-text, #0f172a); }
    .btn-icon .material-icons { font-size: 18px; }

    .filter-row { margin-bottom: 16px; }

    .search-box {
      display: flex; align-items: center; gap: 8px; padding: 0 12px;
      height: 40px; background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e2e8f0); border-radius: var(--radius-md, 8px);
      max-width: 360px; transition: border-color 0.15s;
    }

    .search-box:focus-within { border-color: var(--color-primary, #00BCD4); }
    .search-box .material-icons { font-size: 18px; color: var(--color-text-muted, #64748b); }
    .search-box input { flex: 1; border: none; background: transparent; font-size: 13px; color: var(--color-text, #0f172a); outline: none; }

    /* Drawer */
    .drawer-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 200; }
    .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 480px; background: var(--color-surface, #fff); border-left: 1px solid var(--color-border, #e2e8f0); z-index: 201; display: flex; flex-direction: column; }
    .drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--color-border, #e2e8f0); }
    .drawer-title { font-size: 16px; font-weight: 700; color: var(--color-text, #0f172a); }
    .drawer-body { flex: 1; overflow-y: auto; padding: 20px; }
    .coming-soon-note { color: var(--color-text-muted, #64748b); font-style: italic; }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--color-border, #e2e8f0); }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--color-primary, #00BCD4); color: #fff; border: none; border-radius: var(--radius-md, 8px); padding: 10px 20px; font-size: 13px; font-weight: 700; cursor: pointer; }
    .btn-primary:hover { background: #0097a7; }
    .btn-secondary { display: inline-flex; align-items: center; gap: 6px; background: var(--color-surface, #fff); color: var(--color-text-muted, #64748b); border: 1px solid var(--color-border, #e2e8f0); border-radius: var(--radius-md, 8px); padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-secondary:hover { background: var(--color-bg, #f8fafc); }

    @media (max-width: 900px) { .two-col { grid-template-columns: 1fr; } }
  `],
})
export class PharmacyOutboundComponent implements OnInit {
  private http = inject(HttpClient);

  activeTab        = signal<Tab>('dotations');
  loading          = signal(true);
  selectedServiceId = signal<string | null>(null);
  drawerOpen       = signal(false);
  dispenseTarget   = signal<BonDispensation | null>(null);
  searchQuery      = '';

  services      = signal<{ id: string; name: string }[]>([]);
  dotations     = signal<Dotation[]>([]);
  bons          = signal<BonDispensation[]>([]);
  filteredBons  = signal<BonDispensation[]>([]);

  ngOnInit(): void {
    this.http.get<any>(`${environment.baseUrl}/pharmacy/distribution`).subscribe({
      next: (data) => {
        this.services.set(data.services ?? []);
        this.dotations.set(data.dotations ?? []);
        this.bons.set(data.bons ?? []);
        this.filteredBons.set(data.bons ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.services.set([]);
        this.dotations.set([]);
        this.bons.set([]);
        this.filteredBons.set([]);
        this.loading.set(false);
      },
    });
  }

  setTab(tab: Tab): void { this.activeTab.set(tab); }

  selectService(id: string): void { this.selectedServiceId.set(id); }

  selectedServiceName(): string {
    return this.services().find(s => s.id === this.selectedServiceId())?.name ?? '';
  }

  serviceDotations(): Dotation[] {
    return this.dotations().filter(d => d.serviceId === this.selectedServiceId());
  }

  openDispense(bon: BonDispensation): void {
    this.dispenseTarget.set(bon);
    this.drawerOpen.set(true);
  }

  confirmDispense(): void {
    alert('Dispensation confirmée (à connecter au backend).');
    this.closeDrawer();
  }

  closeDrawer(): void { this.drawerOpen.set(false); }
}
