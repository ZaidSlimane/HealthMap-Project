import {
  Component, ChangeDetectionStrategy, Input, Output, EventEmitter,
  inject, signal, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface UnitWithBeds {
  id: number;
  name: string;
  rooms: { id: number; name: string; beds: { id: number; bed_number: string }[] }[];
}

@Component({
  selector: 'app-admission-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible) {
      <div class="modal-overlay" (click)="close()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">Admission du patient</h2>
            <button class="btn-close" (click)="close()">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="modal-body">
            <!-- Service (read-only, auto-set from consultation) -->
            <div class="form-group">
              <label class="form-label">Service</label>
              <div class="service-display">
                <span class="material-icons">local_hospital</span>
                <span>{{ serviceName() || 'Service actuel' }}</span>
              </div>
            </div>

            <!-- Bed selector (grouped by unit → room) -->
            <div class="form-group">
              <label class="form-label">Lit disponible <span class="required">*</span></label>
              @if (loadingBeds()) {
                <div class="loading-beds">Chargement des lits...</div>
              } @else if (units().length === 0 && selectedServiceId()) {
                <div class="no-beds">Aucun lit disponible dans ce service.</div>
              } @else {
                <div class="bed-tree">
                  @for (unit of units(); track unit.id) {
                    <div class="unit-group">
                      <div class="unit-label">{{ unit.name }}</div>
                      @for (room of unit.rooms; track room.id) {
                        <div class="room-group">
                          <div class="room-label">{{ room.name }}</div>
                          <div class="bed-grid">
                            @for (bed of room.beds; track bed.id) {
                              <button
                                class="bed-btn"
                                [class.bed-selected]="selectedBedId() === bed.id"
                                (click)="selectBed(bed.id)">
                                {{ bed.bed_number }}
                              </button>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Motif -->
            <div class="form-group">
              <label class="form-label">Motif d'admission</label>
              <textarea
                class="form-input form-textarea"
                rows="3"
                placeholder="Motif (pré-rempli depuis le diagnostic)"
                [ngModel]="motif()"
                (ngModelChange)="motif.set($event)">
              </textarea>
            </div>

            @if (errorMessage()) {
              <div class="error-banner">
                <span class="material-icons">error</span>
                {{ errorMessage() }}
              </div>
            }
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" (click)="close()">Annuler</button>
            <button
              class="btn-submit"
              [disabled]="!canSubmit() || submitting()"
              (click)="submit()">
              @if (submitting()) {
                <div class="btn-spinner"></div>
              }
              <span class="material-icons">local_hospital</span>
              Confirmer l'admission
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(4px);
      animation: fadeIn 0.2s ease;
    }

    .modal-card {
      width: 100%;
      max-width: 560px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      background: var(--color-surface, #fff);
      border-radius: var(--radius-lg, 14px);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.25s ease;
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid var(--color-border, #e2e8f0);
    }

    .modal-title {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: var(--color-text, #0f172a);
    }

    .btn-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 6px;
      color: var(--color-text-muted, #64748b);
      cursor: pointer;
    }

    .btn-close:hover {
      background: var(--color-surface-alt, #f1f5f9);
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
    }

    .form-group {
      margin-bottom: 18px;
    }

    .form-label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
    }

    .required {
      color: #dc2626;
    }

    .form-input {
      width: 100%;
      padding: 10px 14px;
      border-radius: 6px;
      border: 1px solid var(--color-border, #e2e8f0);
      font-size: 14px;
      color: var(--color-text, #0f172a);
      background: var(--color-surface, #fff);
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-primary, #00BCD4);
    }

    .form-textarea {
      resize: vertical;
      font-family: inherit;
    }

    .loading-beds, .no-beds {
      padding: 16px;
      text-align: center;
      font-size: 13px;
      color: var(--color-text-muted, #64748b);
      background: var(--color-surface-alt, #f8fafc);
      border-radius: 6px;
    }

    .service-display {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 6px;
      background: rgba(0, 188, 212, 0.06);
      border: 1px solid rgba(0, 188, 212, 0.2);
      font-size: 14px;
      font-weight: 500;
      color: var(--color-primary, #00BCD4);
    }

    .service-display .material-icons {
      font-size: 18px;
    }

    .bed-tree {
      max-height: 240px;
      overflow-y: auto;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: 6px;
      padding: 12px;
    }

    .unit-group {
      margin-bottom: 12px;
    }

    .unit-group:last-child {
      margin-bottom: 0;
    }

    .unit-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-primary, #00BCD4);
      margin-bottom: 6px;
    }

    .room-group {
      margin-left: 12px;
      margin-bottom: 8px;
    }

    .room-label {
      font-size: 12px;
      color: var(--color-text-muted, #64748b);
      margin-bottom: 4px;
    }

    .bed-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-left: 8px;
    }

    .bed-btn {
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--color-border, #e2e8f0);
      background: var(--color-surface, #fff);
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text, #0f172a);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .bed-btn:hover {
      border-color: var(--color-primary, #00BCD4);
      background: rgba(0, 188, 212, 0.04);
    }

    .bed-btn.bed-selected {
      border-color: var(--color-primary, #00BCD4);
      background: var(--color-primary, #00BCD4);
      color: #fff;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 6px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      font-size: 13px;
    }

    .error-banner .material-icons {
      font-size: 18px;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 24px;
      border-top: 1px solid var(--color-border, #e2e8f0);
    }

    .btn-cancel {
      padding: 10px 18px;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: 10px;
      background: var(--color-surface, #fff);
      color: var(--color-text-muted, #64748b);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-submit {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border: none;
      border-radius: 10px;
      background: #16a34a;
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-submit:hover:not(:disabled) {
      background: #15803d;
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-submit .material-icons {
      font-size: 18px;
    }

    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AdmissionModalComponent implements OnChanges {
  private readonly http = inject(HttpClient);
  private readonly API = environment.baseUrl;

  @Input() visible = false;
  @Input() consultationId!: number;
  @Input() serviceId!: number;
  @Input() diagnostic = '';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() admitted = new EventEmitter<any>();

  readonly services = signal<{ id: number; name: string }[]>([]);
  readonly serviceName = signal('');
  readonly units = signal<UnitWithBeds[]>([]);
  readonly selectedServiceId = signal<number | null>(null);
  readonly selectedBedId = signal<number | null>(null);
  readonly motif = signal('');
  readonly loadingBeds = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  readonly canSubmit = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetState();
      this.motif.set(this.diagnostic || '');
      this.selectedServiceId.set(this.serviceId);
      if (this.serviceId) {
        this.loadFreeBeds(this.serviceId);
        this.loadServiceName(this.serviceId);
      }
    }
  }

  onServiceChange(serviceId: number): void {
    // Not used anymore — service is fixed from consultation context
  }

  selectBed(bedId: number): void {
    this.selectedBedId.set(bedId);
    this.updateCanSubmit();
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  submit(): void {
    if (!this.canSubmit()) return;

    this.submitting.set(true);
    this.errorMessage.set('');

    this.http.post<any>(`${this.API}/clinical-core/consultations/${this.consultationId}/admit`, {
      service_id: this.serviceId,
      bed_id: this.selectedBedId(),
      motif: this.motif() || null,
    }).subscribe({
      next: (admission) => {
        this.submitting.set(false);
        this.admitted.emit(admission);
        this.close();
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Erreur lors de l\'admission.');
      }
    });
  }

  private loadFreeBeds(serviceId: number): void {
    this.loadingBeds.set(true);
    this.http.get<UnitWithBeds[]>(`${this.API}/clinical-core/services/${serviceId}/free-beds`).subscribe({
      next: (units) => {
        this.units.set(units);
        this.loadingBeds.set(false);
      },
      error: () => {
        this.units.set([]);
        this.loadingBeds.set(false);
      }
    });
  }

  private updateCanSubmit(): void {
    this.canSubmit.set(!!(this.serviceId && this.selectedBedId()));
  }

  private loadServiceName(serviceId: number): void {
    this.http.get<any>(`${this.API}/clinical-core/services/${serviceId}`).subscribe({
      next: (svc) => this.serviceName.set(svc.name || 'Service'),
      error: () => this.serviceName.set('Service')
    });
  }

  private resetState(): void {
    this.selectedBedId.set(null);
    this.units.set([]);
    this.errorMessage.set('');
    this.submitting.set(false);
    this.canSubmit.set(false);
  }
}
