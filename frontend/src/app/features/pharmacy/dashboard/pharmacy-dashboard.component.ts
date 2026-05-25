import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/ui/stat-card/stat-card.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import type { DashboardKpis, AlertItem, PendingOrder, RecentMovement } from '../models/pharmacy.models';

@Component({
  selector: 'hm-pharmacy-dashboard',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, StatCardComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hm-page-header
      title="Tableau de bord — Pharmacie"
      subtitle="Vue d'ensemble de l'activité pharmaceutique"
      icon="medication">
    </hm-page-header>

    @if (loading()) {
      <hm-spinner label="Chargement du tableau de bord..." />
    } @else {
      <!-- KPI Strip -->
      <div class="kpi-strip">
        <hm-stat-card
          label="Produits en stock"
          [value]="kpis()?.produits_en_stock ?? 0"
          icon="inventory_2"
          gradient="linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)" />
        <hm-stat-card
          label="Alertes critiques"
          [value]="kpis()?.alertes_critiques ?? 0"
          icon="warning"
          gradient="linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)" />
        <hm-stat-card
          label="Commandes en attente"
          [value]="kpis()?.commandes_en_attente ?? 0"
          icon="pending_actions"
          gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" />
        <hm-stat-card
          label="Valeur totale stock"
          [value]="(kpis()?.valeur_totale_stock ?? 0 | number:'1.0-0') + ' DA'"
          icon="account_balance"
          gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" />
      </div>

      <!-- Two-column panels -->
      <div class="two-col">
        <!-- Alert list -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Produits sous le seuil</span>
          </div>
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Stock actuel</th>
                  <th>Seuil mini</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (item of alertList(); track item.id) {
                  <tr>
                    <td>{{ item.nom_commercial }}</td>
                    <td>{{ item.stock_actuel }}</td>
                    <td>{{ item.seuil_min }}</td>
                    <td>
                      <span class="badge"
                        [class.badge--danger]="item.statut === 'critique'"
                        [class.badge--warn]="item.statut === 'alerte'">
                        {{ item.statut === 'critique' ? 'Critique' : 'Alerte' }}
                      </span>
                    </td>
                    <td>
                      <button class="btn-link" (click)="navigate('/pharmacie/approvisionnement')">
                        Commander
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="empty-cell">Aucune alerte</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pending orders -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Commandes en attente</span>
          </div>
          <div class="table-scroll">
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
                      <span class="badge"
                        [class.badge--warn]="order.statut === 'en_attente'"
                        [class.badge--info]="order.statut === 'confirmee'"
                        [class.badge--ok]="order.statut === 'recue'">
                        {{ orderLabel(order.statut) }}
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
        <div class="panel-header">
          <span class="panel-title">Mouvements récents</span>
        </div>
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Type</th>
                <th>Quantité</th>
                <th>Source / Destination</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              @for (m of recentMovements(); track m.id) {
                <tr>
                  <td>{{ m.produit }}</td>
                  <td>
                    <span class="badge"
                      [class.badge--ok]="m.type === 'entree'"
                      [class.badge--danger]="m.type === 'sortie'">
                      {{ m.type === 'entree' ? 'Entrée' : 'Sortie' }}
                    </span>
                  </td>
                  <td>{{ m.quantite }}</td>
                  <td>{{ m.service_fournisseur }}</td>
                  <td>{{ m.date }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty-cell">Aucun mouvement récent</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
  styles: [`
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .two-col {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .panel {
      background: var(--color-surface, #fff);
      border-radius: var(--radius-lg, 14px);
      border: 1px solid var(--color-border, #e2e8f0);
      overflow: hidden;
      margin-bottom: 16px;
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

    .table-scroll {
      overflow-x: auto;
      max-height: 300px;
      overflow-y: auto;
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
      padding: 24px;
    }

    .badge {
      display: inline-block;
      padding: 3px 9px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .badge--danger  { background: rgba(239,68,68,0.1);  color: #b91c1c; }
    .badge--warn    { background: rgba(245,158,11,0.1); color: #b45309; }
    .badge--info    { background: rgba(59,130,246,0.1); color: #1d4ed8; }
    .badge--ok      { background: rgba(34,197,94,0.1);  color: #15803d; }

    .btn-link {
      border: none;
      background: none;
      color: var(--color-primary, #00BCD4);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      text-decoration: underline;
      white-space: nowrap;
    }

    @media (max-width: 1100px) {
      .kpi-strip { grid-template-columns: repeat(2, 1fr); }
      .two-col   { grid-template-columns: 1fr; }
    }
  `],
})
export class PharmacyDashboardComponent implements OnInit {
  private http   = inject(HttpClient);
  private router = inject(Router);

  loading        = signal(true);
  kpis           = signal<DashboardKpis | null>(null);
  alertList      = signal<AlertItem[]>([]);
  pendingOrders  = signal<PendingOrder[]>([]);
  recentMovements = signal<RecentMovement[]>([]);

  ngOnInit(): void {
    this.http.get<any>(`${environment.baseUrl}/pharmacy/dashboard`).subscribe({
      next: (data) => {
        this.kpis.set(data.kpis ?? null);
        this.alertList.set(data.alert_list ?? []);
        this.pendingOrders.set(data.pending_orders ?? []);
        this.recentMovements.set(data.recent_movements ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  orderLabel(s: string): string {
    const map: Record<string, string> = {
      en_attente: 'En attente',
      confirmee:  'Confirmée',
      recue:      'Reçue',
    };
    return map[s] ?? s;
  }

  navigate(route: string): void { this.router.navigate([route]); }
}
