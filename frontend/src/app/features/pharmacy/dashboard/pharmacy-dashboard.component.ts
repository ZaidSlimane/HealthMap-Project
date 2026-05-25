import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import type { DashboardKpis, AlertItem, PendingOrder, RecentMovement } from '../models/pharmacy.models';

@Component({
  selector: 'hm-pharmacy-dashboard',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard">
      <h2 class="page-title">Tableau de bord</h2>

      <!-- KPI Row -->
      <div class="kpi-row">
        <div class="kpi-card">
          <span class="material-icons kpi-icon">package</span>
          <div class="kpi-content">
            <span class="kpi-value">{{ kpis()?.produits_en_stock ?? '—' }}</span>
            <span class="kpi-label">Produits en stock</span>
          </div>
        </div>
        <div class="kpi-card kpi-card--danger">
          <span class="material-icons kpi-icon">alert_triangle</span>
          <div class="kpi-content">
            <span class="kpi-value">{{ kpis()?.alertes_critiques ?? '—' }}</span>
            <span class="kpi-label">Alertes critiques</span>
          </div>
        </div>
        <div class="kpi-card">
          <span class="material-icons kpi-icon">clock</span>
          <div class="kpi-content">
            <span class="kpi-value">{{ kpis()?.commandes_en_attente ?? '—' }}</span>
            <span class="kpi-label">Commandes en attente</span>
          </div>
        </div>
        <div class="kpi-card">
          <span class="material-icons kpi-icon">currency-usd</span>
          <div class="kpi-content">
            <span class="kpi-value">{{ (kpis()?.valeur_totale_stock ?? 0) | number:'1.0-0' }} DA</span>
            <span class="kpi-label">Valeur totale</span>
          </div>
        </div>
      </div>

      <!-- Two columns -->
      <div class="two-columns">
        <!-- Alert list -->
        <div class="panel">
          <h3 class="panel-title">Produits sous le seuil</h3>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Stock</th>
                  <th>Seuil</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                @for (item of alertList(); track item.id) {
                  <tr>
                    <td>{{ item.nom_commercial }}</td>
                    <td>{{ item.stock_actuel }}</td>
                    <td>{{ item.seuil_min }}</td>
                    <td>
                      <span class="status-chip" [class.critique]="item.statut === 'critique'" [class.alerte]="item.statut === 'alerte'">
                        {{ item.statut }}
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="empty-cell">Aucune alerte</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pending orders -->
        <div class="panel">
          <h3 class="panel-title">Commandes en attente</h3>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Réf.</th>
                  <th>Fournisseur</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                @for (order of pendingOrders(); track order.id) {
                  <tr>
                    <td>{{ order.reference }}</td>
                    <td>{{ order.fournisseur }}</td>
                    <td>{{ order.date_commande }}</td>
                    <td>
                      <span class="status-chip" [class.en-attente]="order.statut === 'en_attente'" [class.confirmee]="order.statut === 'confirmee'">
                        {{ order.statut }}
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="empty-cell">Aucune commande</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Recent movements -->
      <div class="panel">
        <h3 class="panel-title">Mouvements récents</h3>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Type</th>
                <th>Quantité</th>
                <th>Source/Destination</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              @for (m of recentMovements(); track m.id) {
                <tr>
                  <td>{{ m.produit }}</td>
                  <td>
                    <span class="type-badge" [class.entree]="m.type === 'entree'" [class.sortie]="m.type === 'sortie'">
                      {{ m.type }}
                    </span>
                  </td>
                  <td>{{ m.quantite }}</td>
                  <td>{{ m.service_fournisseur }}</td>
                  <td>{{ m.date }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty-cell">Aucun mouvement</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1200px; }

    .page-title {
      margin: 0 0 24px;
      font-size: 22px;
      font-weight: 700;
      color: var(--color-text, #0F172A);
    }

    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: var(--color-surface, #fff);
      border-radius: 12px;
      border: 1px solid var(--color-border, #E2E8F0);
    }

    .kpi-card--danger {
      background: #FEF2F2;
      border-color: #FECACA;
    }

    .kpi-icon {
      font-size: 32px;
      color: var(--color-primary, #00BCD4);
    }

    .kpi-card--danger .kpi-icon {
      color: #EF4444;
    }

    .kpi-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .kpi-value {
      font-size: 24px;
      font-weight: 800;
      color: var(--color-text, #0F172A);
    }

    .kpi-label {
      font-size: 12px;
      color: var(--color-text-muted, #64748B);
    }

    .two-columns {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }

    .panel {
      background: var(--color-surface, #fff);
      border-radius: 12px;
      border: 1px solid var(--color-border, #E2E8F0);
      overflow: hidden;
    }

    .panel-title {
      margin: 0;
      padding: 16px;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text, #0F172A);
      border-bottom: 1px solid var(--color-border, #E2E8F0);
    }

    .table-wrap {
      max-height: 280px;
      overflow-y: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .data-table th {
      text-align: left;
      padding: 10px 12px;
      font-weight: 600;
      color: var(--color-text-muted, #64748B);
      background: var(--color-bg, #F8FAFC);
      border-bottom: 1px solid var(--color-border, #E2E8F0);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .data-table td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--color-border, #E2E8F0);
      color: var(--color-text, #0F172A);
    }

    .empty-cell {
      text-align: center;
      color: var(--color-text-muted, #94A3B8);
      font-style: italic;
    }

    .status-chip {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-chip.critique {
      background: #FEE2E2;
      color: #B91C1C;
    }

    .status-chip.alerte {
      background: #FEF3C7;
      color: #B45309;
    }

    .status-chip.en-attente {
      background: #FEF3C7;
      color: #B45309;
    }

    .status-chip.confirmee {
      background: #DBEAFE;
      color: #1D4ED8;
    }

    .type-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }

    .type-badge.entree {
      background: #D1FAE5;
      color: #047857;
    }

    .type-badge.sortie {
      background: #FEE2E2;
      color: #B91C1C;
    }

    @media (max-width: 900px) {
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
      .two-columns { grid-template-columns: 1fr; }
    }
  `],
})
export class PharmacyDashboardComponent implements OnInit {
  private http = inject(HttpClient);

  kpis = signal<DashboardKpis | null>(null);
  alertList = signal<AlertItem[]>([]);
  pendingOrders = signal<PendingOrder[]>([]);
  recentMovements = signal<RecentMovement[]>([]);

  ngOnInit(): void {
    this.http.get<any>(`${environment.baseUrl}/pharmacy/dashboard`).subscribe({
      next: (data) => {
        this.kpis.set(data.kpis);
        this.alertList.set(data.alert_list ?? []);
        this.pendingOrders.set(data.pending_orders ?? []);
        this.recentMovements.set(data.recent_movements ?? []);
      },
      error: (err) => console.error('[PharmacyDashboard] Failed to load:', err),
    });
  }
}
