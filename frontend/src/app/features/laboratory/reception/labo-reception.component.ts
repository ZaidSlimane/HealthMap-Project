import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { environment } from '../../../../environments/environment';

interface ReceptionRequest {
  id: number;
  admission_number: number | null;
  patient: { nom: string; prenom: string } | null;
  service: string | null;
  doctor: { name: string } | null;
  requested_at: string;
  requested_by: { name: string } | null;
  urgency: string;
  status: string;
  notes: string | null;
}

@Component({
  selector: 'app-labo-reception',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hm-page-header
      title="Tableau de bord Réceptionniste"
      subtitle="Réception des prélèvements biologiques"
      icon="science">
    </hm-page-header>

    <div class="tab-nav">
      <button
        class="tab-btn"
        [class.active]="activeTab() === 'reception'"
        (click)="activeTab.set('reception')">
        <span class="material-icons">inbox</span>
        Réception des tubes
      </button>
      <button
        class="tab-btn"
        [class.active]="activeTab() === 'service'"
        (click)="activeTab.set('service')">
        <span class="material-icons">local_hospital</span>
        Demandes d'un service
      </button>
      <button
        class="tab-btn"
        [class.active]="activeTab() === 'externe'"
        (click)="activeTab.set('externe')">
        <span class="material-icons">person</span>
        Malade externe
      </button>
      <button
        class="tab-btn"
        [class.active]="activeTab() === 'print'"
        (click)="activeTab.set('print')">
        <span class="material-icons">print</span>
        Imprimer Résultats
      </button>
    </div>

    @if (activeTab() === 'reception') {
      @if (loading()) {
        <hm-spinner label="Chargement des demandes..." />
      } @else {
        @if (successId()) {
          <div class="success-toast">
            <span class="material-icons">check_circle</span>
            Prélèvement marqué comme reçu avec succès.
          </div>
        }

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>N° Admission</th>
                <th>Patient</th>
                <th>Service</th>
                <th>Médecin</th>
                <th>Date de la demande</th>
                <th>Infirmier</th>
                <th>Date du prélèvement</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (item of requests(); track item.id) {
                <tr [class.row-success]="item.id === successId()">
                  <td>{{ item.admission_number || '—' }}</td>
                  <td class="cell-name">{{ item.patient?.nom }} {{ item.patient?.prenom }}</td>
                  <td>{{ item.service || '—' }}</td>
                  <td>{{ item.doctor?.name || '—' }}</td>
                  <td>{{ item.requested_at | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td>{{ item.requested_by?.name || '—' }}</td>
                  <td>—</td>
                  <td>
                    <button
                      class="btn-receive"
                      (click)="markAsReceived(item.id)"
                      [disabled]="receivingId() === item.id">
                      @if (receivingId() === item.id) {
                        <span class="material-icons spin">sync</span>
                      } @else {
                        <span class="material-icons">check_circle</span>
                      }
                      Prélèvement Reçu
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="empty-state">
                    <span class="material-icons empty-icon">science</span>
                    <p>Aucune demande en attente de réception</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    } @else {
      <div class="placeholder-content">
        <span class="material-icons placeholder-icon">construction</span>
        <p>Cette fonctionnalité sera disponible prochainement.</p>
      </div>
    }
  `,
  styles: [`
    .tab-nav {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--color-border, #e2e8f0);
      background: var(--color-surface, #fff);
      color: var(--color-text-muted, #64748b);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tab-btn .material-icons {
      font-size: 18px;
    }

    .tab-btn:hover {
      border-color: #16a34a;
      color: #16a34a;
    }

    .tab-btn.active {
      background: #16a34a;
      border-color: #16a34a;
      color: #fff;
    }

    .success-toast {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      border-radius: var(--radius-md, 10px);
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #16a34a;
      font-size: 14px;
      font-weight: 500;
      animation: fadeIn 0.3s ease;
    }

    .success-toast .material-icons {
      font-size: 20px;
    }

    .table-container {
      background: var(--color-surface, #fff);
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--color-border, #e2e8f0);
      overflow: hidden;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      text-align: left;
      padding: 12px 16px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted, #64748b);
      background: var(--color-surface-alt, #f8fafc);
      border-bottom: 1px solid var(--color-border, #e2e8f0);
    }

    .data-table td {
      padding: 12px 16px;
      font-size: 14px;
      color: var(--color-text, #0f172a);
      border-bottom: 1px solid var(--color-border, #e2e8f0);
    }

    .data-table tbody tr:last-child td {
      border-bottom: none;
    }

    .data-table tbody tr:hover {
      background: var(--color-surface-alt, #f8fafc);
    }

    .data-table tbody tr.row-success {
      background: #f0fdf4;
      animation: flashGreen 1.5s ease;
    }

    .cell-name {
      font-weight: 500;
    }

    .btn-receive {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 14px;
      border-radius: var(--radius-sm, 6px);
      border: 1px solid #16a34a;
      background: rgba(22, 163, 74, 0.08);
      color: #16a34a;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-receive:hover:not(:disabled) {
      background: #16a34a;
      color: #fff;
    }

    .btn-receive:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-receive .material-icons {
      font-size: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 16px;
      color: var(--color-text-muted, #64748b);
    }

    .empty-icon {
      font-size: 48px;
      opacity: 0.3;
      display: block;
      margin-bottom: 12px;
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
    }

    .placeholder-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      color: var(--color-text-muted, #64748b);
      text-align: center;
    }

    .placeholder-icon {
      font-size: 48px;
      opacity: 0.3;
      margin-bottom: 12px;
    }

    .placeholder-content p {
      margin: 0;
      font-size: 14px;
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes flashGreen {
      0% { background: #dcfce7; }
      100% { background: #f0fdf4; }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class LaboReceptionComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly API = environment.baseUrl;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private successTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly requests = signal<ReceptionRequest[]>([]);
  readonly loading = signal(true);
  readonly activeTab = signal('reception');
  readonly receivingId = signal<number | null>(null);
  readonly successId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadRequests();
    this.pollingInterval = setInterval(() => this.loadRequests(), 3000);
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
  }

  markAsReceived(id: number): void {
    this.receivingId.set(id);
    this.http.patch<any>(`${this.API}/laboratory/reception/${id}/receive`, {}).subscribe({
      next: () => {
        this.receivingId.set(null);
        this.successId.set(id);
        this.successTimeout = setTimeout(() => this.successId.set(null), 3000);
        this.loadRequests();
      },
      error: () => {
        this.receivingId.set(null);
      }
    });
  }

  private loadRequests(): void {
    this.http.get<ReceptionRequest[]>(`${this.API}/laboratory/reception`).subscribe({
      next: (data) => {
        this.requests.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
