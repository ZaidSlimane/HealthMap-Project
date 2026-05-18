import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner.component';
import { ConsultationSessionService } from '../../core/services/consultation-session.service';
import { environment } from '../../../environments/environment';

interface Patient {
  id: number;
  name: string;
  first_name: string;
  date_of_birth: string;
  gender: string;
}

interface QueueItem {
  id: number;
  patient_id: number;
  patient: Patient | null;
  priority: 'red' | 'orange' | 'green';
  status: 'waiting' | 'called' | 'en_consultation' | 'absent' | 'rappele' | 'completed';
  added_at: string;
  called_count: number;
}

interface ConsultationHistory {
  id: number;
  consultation_date: string;
  patient_name: string;
  motif: string;
  diagnostic?: string;
}

@Component({
  selector: 'app-queue-call',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hm-page-header
      title="File d'attente"
      [subtitle]="boxLabel()"
      icon="phone_in_talk">
      <button class="btn-back" (click)="backToBoxes()">
        <span class="material-icons">arrow_back</span>
        Changer de box
      </button>
    </hm-page-header>

    <div class="queue-layout">
      <!-- LEFT: history panel (always visible, beside the queue) -->
      <div class="left-col">
        <div class="history-panel">
          <div class="panel-header">
            <div class="panel-title">
              <span class="material-icons history-icon">history</span>
              <span>Historique des consultations</span>
            </div>
            <button class="btn-icon" (click)="historyExpanded.set(!historyExpanded())">
              <span class="material-icons">{{ historyExpanded() ? 'expand_less' : 'expand_more' }}</span>
            </button>
          </div>
          @if (historyExpanded()) {
            <div class="panel-body">
              @if (consultationHistory().length === 0) {
                <div class="empty-history">
                  <span class="material-icons">event_note</span>
                  <p>Aucune consultation antérieure aujourd'hui.</p>
                </div>
              } @else {
                <div class="history-list">
                  @for (item of consultationHistory(); track item.id) {
                    <div class="history-item">
                      <div class="history-time">{{ item.consultation_date | date:'HH:mm' }}</div>
                      <div class="history-content">
                        <div class="history-patient">{{ item.patient_name }}</div>
                        <div class="history-motif">{{ item.motif }}</div>
                        @if (item.diagnostic) {
                          <div class="history-diagnostic">
                            <span class="material-icons">medical_information</span>
                            {{ item.diagnostic }}
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- RIGHT: Waiting list -->
      <div class="waiting-panel">
        <div class="panel-header">
          <div class="panel-title">
            <span class="material-icons">format_list_numbered</span>
            <span>Liste d'attente</span>
          </div>
          <span class="badge-count">{{ queueList().length }}</span>
        </div>

        <div class="panel-body">
          @if (loading()) {
            <hm-spinner label="Chargement de la file..." />
          } @else {
            @if (queueList().length === 0) {
              <div class="empty-queue">
                <span class="material-icons">hourglass_empty</span>
                <p>Aucun patient en attente.</p>
              </div>
            } @else {
              <div class="queue-items">
                @for (item of queueList(); track item.id) {
                  <div class="queue-card"
                       [class]="'priority-' + item.priority + ' status-' + item.status"
                       [class.queue-card-selected]="selectedId() === item.id"
                       (click)="selectItem(item)">
                    <div class="queue-card-left">
                      <span class="queue-number">{{ item.id }}</span>
                      @if (item.priority === 'red') {
                        <span class="priority-badge">URGENT</span>
                      }
                    </div>

                    <div class="queue-card-center">
                      <div class="patient-name">
                        @if (item.patient) {
                          {{ item.patient.name }} {{ item.patient.first_name }}
                        } @else {
                          Patient #{{ item.patient_id }}
                        }
                      </div>
                      <div class="status-label">{{ statusLabel(item.status) }}</div>
                    </div>

                    <button class="call-button"
                            (click)="quickCall(item); $event.stopPropagation()"
                            title="Appeler">
                      <span class="material-icons">phone_in_talk</span>
                    </button>
                  </div>
                }
              </div>
            }
          }
        </div>
      </div>
    </div>

    <!-- BOTTOM: selected patient card (full width, under the queue area) -->
    @if (selectedItem(); as sel) {
      <div class="workspace-detail">
        <div class="detail-header">
          <div class="detail-patient-block">
            <div class="patient-avatar">
              <span class="material-icons">{{ sel.patient?.gender === 'F' ? 'face_3' : 'face' }}</span>
            </div>
            <div class="patient-meta">
              <div class="patient-fullname">
                {{ sel.patient?.name }} {{ sel.patient?.first_name }}
              </div>
              <div class="patient-secondary">
                @if (sel.patient?.date_of_birth) {
                  <span><span class="material-icons">cake</span> {{ sel.patient?.date_of_birth | date:'dd/MM/yyyy' }}</span>
                }
                @if (sel.patient?.gender) {
                  <span><span class="material-icons">person</span> {{ sel.patient?.gender === 'F' ? 'Féminin' : 'Masculin' }}</span>
                }
                <span class="status-chip" [class]="'chip-' + sel.status">
                  {{ statusLabel(sel.status) }}
                </span>
              </div>
            </div>
          </div>

          <div class="detail-queue-num">
            <span class="num-label">N°</span>
            <span class="num-value">{{ sel.id }}</span>
            <span class="priority-pill" [class]="'pill-' + sel.priority">
              {{ priorityLabel(sel.priority) }}
            </span>
          </div>
        </div>

        <div class="detail-actions">
          <button class="btn-action btn-primary" (click)="startConsultation(sel)">
            <span class="material-icons">{{ sel.status === 'en_consultation' ? 'replay' : 'play_arrow' }}</span>
            <span>{{ sel.status === 'en_consultation' ? 'Reprendre la consultation' : 'Démarrer la consultation' }}</span>
          </button>
          <button class="btn-action btn-info" (click)="recallPatient(sel)">
            <span class="material-icons">phone</span>
            <span>Rappeler</span>
          </button>
          <button class="btn-action btn-warning" (click)="markAbsent(sel)">
            <span class="material-icons">person_off</span>
            <span>Patient absent</span>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--color-border, #e2e8f0);
      background: var(--color-surface, #fff);
      color: var(--color-text-muted, #64748b);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-back:hover {
      border-color: var(--color-primary, #00BCD4);
      color: var(--color-primary, #00BCD4);
    }

    .btn-back .material-icons {
      font-size: 16px;
    }

    .queue-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 20px;
      align-items: start;
    }

    @media (max-width: 1100px) {
      .queue-layout {
        grid-template-columns: 1fr;
      }
    }

    .left-col,
    .workspace-col {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: 200px;
    }

    .empty-spacer {
      flex: 1;
    }

    .history-bottom {
      margin-top: 16px;
    }

    /* === Workspace empty state === */
    .workspace-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 60px 32px;
      background: var(--color-surface, #fff);
      border-radius: var(--radius-lg, 14px);
      border: 1px dashed var(--color-border, #e2e8f0);
      color: var(--color-text-muted, #64748b);
    }

    .empty-illustration {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(0, 188, 212, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 18px;
    }

    .empty-illustration .material-icons {
      font-size: 40px;
      color: var(--color-primary, #00BCD4);
    }

    .workspace-empty h3 {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
    }

    .workspace-empty p {
      margin: 0;
      font-size: 14px;
      max-width: 320px;
    }

    /* === Workspace detail card (full width, under queue area) === */
    .workspace-detail {
      width: 100%;
      background: var(--color-surface, #fff);
      border-radius: var(--radius-lg, 14px);
      border: 1px solid var(--color-border, #e2e8f0);
      box-shadow: 0 4px 16px rgba(0, 188, 212, 0.08);
      overflow: hidden;
      animation: slide-in 0.25s ease-out;
      margin-top: 20px;
    }

    @keyframes slide-in {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-bottom: 1px solid var(--color-border, #e2e8f0);
      gap: 16px;
    }

    .detail-patient-block {
      display: flex;
      align-items: center;
      gap: 16px;
      min-width: 0;
    }

    .patient-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--color-primary, #00BCD4);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 8px rgba(0, 188, 212, 0.25);
    }

    .patient-avatar .material-icons {
      font-size: 32px;
      color: #fff;
    }

    .patient-meta {
      min-width: 0;
    }

    .patient-fullname {
      font-size: 18px;
      font-weight: 700;
      color: var(--color-text, #0f172a);
      margin-bottom: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .patient-secondary {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      font-size: 12px;
      color: var(--color-text-muted, #64748b);
    }

    .patient-secondary span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .patient-secondary .material-icons {
      font-size: 14px;
    }

    .status-chip {
      padding: 3px 10px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 11px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .chip-waiting {
      background: #f1f5f9;
      color: #475569;
    }

    .chip-called,
    .chip-rappele {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .chip-en_consultation {
      background: #dcfce7;
      color: #15803d;
    }

    .detail-queue-num {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      flex-shrink: 0;
    }

    .num-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.1em;
      color: var(--color-text-muted, #64748b);
    }

    .num-value {
      font-size: 28px;
      font-weight: 800;
      color: var(--color-primary, #00BCD4);
      line-height: 1;
    }

    .priority-pill {
      font-size: 10px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 10px;
      letter-spacing: 0.05em;
    }

    .pill-red {
      background: #fee2e2;
      color: #dc2626;
    }

    .pill-orange {
      background: #fed7aa;
      color: #ea580c;
    }

    .pill-green {
      background: #dcfce7;
      color: #16a34a;
    }

    .patient-action-buttons,
    .detail-actions {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 1px;
      background: var(--color-border, #e2e8f0);
    }

    @media (max-width: 700px) {
      .patient-action-buttons,
      .detail-actions {
        grid-template-columns: 1fr;
      }
    }

    .btn-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px 20px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s ease;
      color: #fff;
      background: var(--color-surface, #fff);
    }

    .btn-action .material-icons {
      font-size: 18px;
    }

    .btn-primary {
      background: #16a34a;
    }

    .btn-primary:hover {
      background: #15803d;
    }

    .btn-info {
      background: #0284c7;
    }

    .btn-info:hover {
      background: #0369a1;
    }

    .btn-warning {
      background: #ea580c;
    }

    .btn-warning:hover {
      background: #c2410c;
    }

    /* === Panels === */
    .history-panel,
    .waiting-panel {
      background: var(--color-surface, #fff);
      border-radius: var(--radius-lg, 14px);
      border: 1px solid var(--color-border, #e2e8f0);
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      background: var(--color-surface-alt, #f8fafc);
      border-bottom: 1px solid var(--color-border, #e2e8f0);
    }

    .panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
    }

    .panel-title .material-icons {
      font-size: 20px;
      color: var(--color-primary, #00BCD4);
    }

    .history-icon {
      color: #ef4444 !important;
    }

    .panel-body {
      padding: 16px;
      min-height: 200px;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: var(--color-text-muted, #64748b);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .btn-icon:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .badge-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 24px;
      padding: 0 8px;
      border-radius: 12px;
      background: var(--color-primary, #00BCD4);
      color: #fff;
      font-size: 12px;
      font-weight: 700;
    }

    /* === Empty states === */
    .empty-history,
    .empty-queue {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      color: var(--color-text-muted, #64748b);
      text-align: center;
    }

    .empty-history .material-icons,
    .empty-queue .material-icons {
      font-size: 40px;
      opacity: 0.3;
      margin-bottom: 8px;
    }

    .empty-history p,
    .empty-queue p {
      margin: 0;
      font-size: 14px;
    }

    /* === History list === */
    .history-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .history-item {
      display: flex;
      gap: 14px;
      padding: 14px;
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--color-border, #e2e8f0);
    }

    .history-time {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-primary, #00BCD4);
      min-width: 50px;
    }

    .history-content {
      flex: 1;
    }

    .history-patient {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
      margin-bottom: 4px;
    }

    .history-motif {
      font-size: 13px;
      color: var(--color-text-muted, #64748b);
      margin-bottom: 6px;
    }

    .history-diagnostic {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #16a34a;
      background: #dcfce7;
      padding: 4px 10px;
      border-radius: 12px;
    }

    .history-diagnostic .material-icons {
      font-size: 14px;
    }

    /* === Queue cards === */
    .queue-items {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .queue-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: var(--radius-md, 10px);
      cursor: pointer;
      transition: all 0.2s ease;
      color: #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      position: relative;
      overflow: hidden;
      border: 2px solid transparent;
    }

    .queue-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .queue-card-selected {
      border-color: #fff;
      box-shadow: 0 0 0 3px rgba(0, 188, 212, 0.5), 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .priority-red {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }

    .priority-orange {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    }

    .priority-green {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    .priority-red.status-en_consultation,
    .priority-orange.status-en_consultation,
    .priority-green.status-en_consultation {
      opacity: 0.6;
      border: 2px dashed rgba(255, 255, 255, 0.5);
    }

    .queue-card-left {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      min-width: 50px;
    }

    .queue-number {
      font-size: 22px;
      font-weight: 800;
      line-height: 1;
    }

    .priority-badge {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.05em;
      background: rgba(255, 255, 255, 0.25);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .queue-card-center {
      flex: 1;
      min-width: 0;
    }

    .queue-card-center .patient-name {
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #fff;
      margin-bottom: 2px;
    }

    .status-label {
      font-size: 11px;
      opacity: 0.85;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .call-button {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .call-button:hover {
      background: rgba(255, 255, 255, 0.35);
      transform: scale(1.1);
    }

    .call-button .material-icons {
      font-size: 18px;
    }
  `]
})
export class QueueCallComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly consultationSession = inject(ConsultationSessionService);

  readonly serviceId = signal<number | null>(null);
  readonly boxId = signal<number | null>(null);
  readonly boxLabel = signal('');
  readonly historyExpanded = signal(true);
  readonly loading = signal(true);
  readonly selectedId = signal<number | null>(null);

  readonly queueList = signal<QueueItem[]>([]);
  readonly consultationHistory = signal<ConsultationHistory[]>([]);

  readonly selectedItem = computed(() => {
    const id = this.selectedId();
    return id ? this.queueList().find(q => q.id === id) ?? null : null;
  });

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const serviceId = Number(params.get('service_id'));
    const boxId = Number(params.get('box_id'));

    if (serviceId && boxId) {
      this.serviceId.set(serviceId);
      this.boxId.set(boxId);
      this.loadBoxInfo();
      this.loadQueue();
      this.loadHistory();
    } else {
      this.boxLabel.set('Aucune box sélectionnée');
      this.loading.set(false);
    }
  }

  selectItem(item: QueueItem): void {
    this.selectedId.set(item.id);
  }

  quickCall(item: QueueItem): void {
    this.http.post(`${environment.baseUrl}/clinical-core/waiting-lists/${item.id}/call`, {}).subscribe({
      next: () => {
        this.selectedId.set(item.id);
        this.loadQueue();
      }
    });
  }

  recallPatient(item: QueueItem): void {
    this.http.post(`${environment.baseUrl}/clinical-core/waiting-lists/${item.id}/rappel`, {}).subscribe({
      next: () => this.loadQueue()
    });
  }

  markAbsent(item: QueueItem): void {
    if (!confirm('Marquer ce patient comme absent ?')) return;
    this.http.post(`${environment.baseUrl}/clinical-core/waiting-lists/${item.id}/absent`, {}).subscribe({
      next: () => {
        this.selectedId.set(null);
        this.loadQueue();
      }
    });
  }

  startConsultation(item: QueueItem): void {
    const navigateToTriage = (consultationId?: number) => {
      // Store session state (survives refresh)
      this.consultationSession.start({
        queueId: item.id,
        patientId: item.patient_id,
        serviceId: this.serviceId()!,
        boxId: this.boxId()!,
        consultationId: consultationId ?? null,
      });

      this.router.navigate(['/consultation/tri'], {
        queryParams: {
          queue_id: item.id,
          patient_id: item.patient_id,
          service_id: this.serviceId(),
          box_id: this.boxId(),
        }
      });
    };

    // If already in consultation, just navigate (resume)
    if (item.status === 'en_consultation') {
      navigateToTriage();
      return;
    }

    const proceed = () => {
      this.http.post<any>(`${environment.baseUrl}/clinical-core/waiting-lists/${item.id}/start`, {}).subscribe({
        next: (res) => {
          const consultationId = res?.consultation?.id ?? null;
          if (consultationId) {
            this.consultationSession.setConsultationId(consultationId);
          }
          navigateToTriage(consultationId);
        },
        error: (err) => {
          // If 422 (already in consultation), just navigate
          if (err.status === 422) {
            navigateToTriage();
          }
        }
      });
    };

    if (item.status === 'waiting') {
      this.http.post(`${environment.baseUrl}/clinical-core/waiting-lists/${item.id}/call`, {}).subscribe({
        next: () => proceed(),
        error: () => proceed()
      });
    } else {
      proceed();
    }
  }

  backToBoxes(): void {
    this.router.navigate(['/consultation']);
  }

  priorityLabel(p: string): string {
    return p === 'red' ? 'URGENT' : p === 'orange' ? 'Modéré' : 'Normal';
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      waiting: 'En attente',
      called: 'Appelé',
      en_consultation: 'En consultation',
      rappele: 'Rappelé',
      absent: 'Absent',
      completed: 'Terminé',
    };
    return map[s] ?? s;
  }

  private loadBoxInfo(): void {
    const boxId = this.boxId();
    const serviceId = this.serviceId();
    if (!boxId || !serviceId) return;

    this.http.get<any[]>(`${environment.baseUrl}/clinical-core/services/${serviceId}/boxes`).subscribe({
      next: (boxes) => {
        const box = boxes.find(b => b.id === boxId);
        if (box) {
          this.boxLabel.set(box.label_fr || box.name);
        }
      }
    });
  }

  private loadQueue(): void {
    const boxId = this.boxId();
    const serviceId = this.serviceId();
    if (!serviceId) return;

    this.loading.set(true);
    this.http.get<any>(`${environment.baseUrl}/clinical-core/waiting-lists`, {
      params: {
        service_id: serviceId,
        ...(boxId ? { box_id: boxId } : {}),
      }
    }).subscribe({
      next: (res) => {
        const data = res.data ?? res;
        const items: QueueItem[] = data
          .filter((w: any) => ['waiting', 'called', 'rappele', 'en_consultation'].includes(w.status))
          .map((w: any) => ({
            id: w.id,
            patient_id: w.patient_id,
            patient: w.patient,
            priority: w.priority,
            status: w.status,
            added_at: w.added_at,
            called_count: w.called_count,
          }));
        this.queueList.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadHistory(): void {
    const boxId = this.boxId();
    if (!boxId) return;

    this.http.get<any>(`${environment.baseUrl}/clinical-core/consultations`, {
      params: { box_id: boxId, per_page: '20' }
    }).subscribe({
      next: (res) => {
        const data = res.data ?? res;
        const items: ConsultationHistory[] = (Array.isArray(data) ? data : []).map((c: any) => ({
          id: c.id,
          consultation_date: c.consultation_date || c.started_at,
          patient_name: c.patient ? `${c.patient.name} ${c.patient.first_name}` : `Patient #${c.patient_id}`,
          motif: c.motif || c.status || '—',
          diagnostic: c.diagnostic,
        }));
        this.consultationHistory.set(items);
      },
      error: () => {}
    });
  }
}
