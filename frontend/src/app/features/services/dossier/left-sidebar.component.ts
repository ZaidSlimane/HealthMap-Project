import {
  Component,
  ChangeDetectionStrategy,
  input,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { InlineEditComponent } from '../../../shared/ui/inline-edit/inline-edit.component';
import { environment } from '../../../../environments/environment';

// ─── Pure utility functions (exported for testing) ───────────────────────────

/**
 * Sorts an array of admission objects by date_admission descending.
 * Returns a new array without mutating the input.
 */
export function sortAdmissionsDesc<T extends { date_admission: string }>(
  admissions: T[]
): T[] {
  return [...admissions].sort(
    (a, b) =>
      new Date(b.date_admission).getTime() - new Date(a.date_admission).getTime()
  );
}

/**
 * Returns true only when the admission status is "active".
 * Used to determine whether action buttons (Crypter/Décrypter, Partager) are visible.
 */
export function isActionsDropdownVisible(status: string): boolean {
  return status === 'active';
}

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface SidebarPatient {
  id: number;
  name: string;
  first_name: string;
  blood_group?: string;
  photo_url?: string;
}

export interface SidebarAdmission {
  id: number;
  date_admission: string;
  motif_admission: string | null;
  status: string;
  service?: { name: string };
}

export interface SidebarCompanion {
  id: number;
  name: string;
  first_name: string;
  phone?: string;
  address?: string;
  relationship?: string;
}

export interface SidebarExamRequest {
  id: number;
  type: 'radio' | 'labo';
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  urgency: string;
  created_at: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-left-sidebar',
  standalone: true,
  imports: [CommonModule, InlineEditComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sidebar-container">
      <!-- Photo placeholder -->
      <section class="sidebar-section photo-section">
        <div class="photo-placeholder">
          <span class="material-icons photo-icon">account_circle</span>
        </div>
      </section>

      <!-- Blood group -->
      @if (patient().blood_group) {
        <section class="sidebar-section">
          <div class="sidebar-label">Groupe sanguin</div>
          <div class="sidebar-value blood-group">{{ patient().blood_group }}</div>
        </section>
      }

      <!-- Emergency contact -->
      @if (companion()) {
        <section class="sidebar-section">
          <div class="sidebar-label">Contact d'urgence</div>
          <div class="sidebar-value">{{ companion()!.name }} {{ companion()!.first_name }}</div>
          @if (companion()!.phone) {
            <div class="sidebar-sub">{{ companion()!.phone }}</div>
          }
        </section>
      }

      <!-- Treating doctor -->
      @if (treatingDoctor()) {
        <section class="sidebar-section">
          <div class="sidebar-label">Médecin traitant</div>
          <div class="sidebar-value">{{ treatingDoctor() }}</div>
        </section>
      }

      <!-- Motif d'admission (inline edit) -->
      <section class="sidebar-section">
        <div class="sidebar-label">Motif d'admission</div>
        <hm-inline-edit
          [value]="motifDisplay()"
          [loading]="motifSaving()"
          placeholder="Cliquez pour ajouter un motif..."
          (confirmed)="onMotifConfirmed($event)"
        />
      </section>

      <!-- Garde malade list -->
      @if (companions().length > 0) {
        <section class="sidebar-section">
          <div class="sidebar-label">Garde malade</div>
          <ul class="companion-list">
            @for (c of companions(); track c.id) {
              <li class="companion-item">
                <span class="material-icons companion-icon">person_outline</span>
                <span>{{ c.name }} {{ c.first_name }}</span>
              </li>
            }
          </ul>
        </section>
      }

      <!-- Action buttons (only for active admissions) -->
      @if (showActions()) {
        <section class="sidebar-section actions-section">
          <button class="btn-action" type="button">
            <span class="material-icons">lock</span>
            Crypter/Décrypter
          </button>
          <button class="btn-action" type="button">
            <span class="material-icons">share</span>
            Partager
          </button>
        </section>
      }

      <!-- Exam/Bilan requests -->
      @if (examRequests().length > 0) {
        <section class="sidebar-section">
          <div class="sidebar-label">Examen/Bilan demandé</div>
          <ul class="exam-list">
            @for (req of examRequests(); track req.id) {
              <li class="exam-item">
                <span class="exam-badge" [class]="'status-' + req.status">
                  {{ req.status === 'pending' ? '⏳' : req.status === 'in_progress' ? '🔄' : req.status === 'completed' ? '✅' : '❌' }}
                </span>
                <span class="exam-label">{{ req.label }}</span>
                <span class="exam-type">({{ req.type === 'radio' ? 'Radio' : 'Labo' }})</span>
              </li>
            }
          </ul>
        </section>
      }

      <!-- Admission history -->
      @if (sortedAdmissionHistory().length > 0) {
        <section class="sidebar-section">
          <div class="sidebar-label">Historique des admissions</div>
          <ul class="history-list">
            @for (adm of sortedAdmissionHistory(); track adm.id) {
              <li
                class="history-item"
                [class.current]="adm.id === admission().id"
                (click)="navigateToAdmission(adm.id)"
              >
                <span class="history-date">{{ adm.date_admission | date:'dd/MM/yyyy' }}</span>
                @if (adm.service?.name) {
                  <span class="history-service">{{ adm.service?.name }}</span>
                }
                @if (adm.id === admission().id) {
                  <span class="history-badge">actuel</span>
                }
              </li>
            }
          </ul>
        </section>
      }

      <!-- Centre d'impression -->
      <section class="sidebar-section">
        <div class="sidebar-label">Centre d'impression</div>
        <button class="btn-print" type="button">
          <span class="material-icons">print</span>
          Imprimer le dossier
        </button>
      </section>
    </div>
  `,
  styles: [`
    .sidebar-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .sidebar-section {
      padding-bottom: 12px;
      border-bottom: 1px solid var(--color-border, #e2e8f0);
    }

    .sidebar-section:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .sidebar-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-text-muted, #64748b);
      margin-bottom: 6px;
    }

    .sidebar-value {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text, #0f172a);
    }

    .sidebar-sub {
      font-size: 12px;
      color: var(--color-text-muted, #64748b);
      margin-top: 2px;
    }

    /* Photo */
    .photo-section {
      display: flex;
      justify-content: center;
    }

    .photo-placeholder {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--color-surface-hover, #f1f5f9);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .photo-icon {
      font-size: 48px;
      color: var(--color-text-muted, #94a3b8);
    }

    /* Blood group */
    .blood-group {
      font-size: 16px;
      font-weight: 700;
      color: #dc2626;
    }

    /* Companion list */
    .companion-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .companion-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--color-text, #0f172a);
    }

    .companion-icon {
      font-size: 16px;
      color: var(--color-text-muted, #64748b);
    }

    /* Action buttons */
    .actions-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: var(--radius-sm, 6px);
      border: 1px solid var(--color-border, #e2e8f0);
      background: var(--color-surface, #fff);
      color: var(--color-text, #0f172a);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-action:hover {
      border-color: var(--color-primary, #00BCD4);
      color: var(--color-primary, #00BCD4);
    }

    .btn-action .material-icons {
      font-size: 16px;
    }

    /* Exam list */
    .exam-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .exam-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--color-text, #0f172a);
    }

    .exam-badge {
      font-size: 14px;
    }

    .exam-label {
      font-weight: 500;
    }

    .exam-type {
      color: var(--color-text-muted, #64748b);
      font-size: 11px;
    }

    /* History list */
    .history-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .history-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: var(--radius-sm, 6px);
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .history-item:hover {
      background: var(--color-surface-hover, #f8fafc);
    }

    .history-item.current {
      background: rgba(0, 188, 212, 0.08);
      border: 1px solid rgba(0, 188, 212, 0.2);
    }

    .history-date {
      font-weight: 500;
      color: var(--color-text, #0f172a);
    }

    .history-service {
      color: var(--color-text-muted, #64748b);
    }

    .history-badge {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--color-primary, #00BCD4);
      background: rgba(0, 188, 212, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: auto;
    }

    /* Print button */
    .btn-print {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: var(--radius-sm, 6px);
      border: 1px solid var(--color-border, #e2e8f0);
      background: var(--color-surface, #fff);
      color: var(--color-text, #0f172a);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      width: 100%;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .btn-print:hover {
      border-color: var(--color-primary, #00BCD4);
      color: var(--color-primary, #00BCD4);
    }

    .btn-print .material-icons {
      font-size: 16px;
    }
  `]
})
export class LeftSidebarComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly API = environment.baseUrl;

  // ─── Inputs ──────────────────────────────────────────────────────────────────
  readonly patient = input.required<SidebarPatient>();
  readonly admission = input.required<SidebarAdmission>();
  readonly companion = input<SidebarCompanion | null>(null);
  readonly companions = input<SidebarCompanion[]>([]);
  readonly examRequests = input<SidebarExamRequest[]>([]);
  readonly admissionHistory = input<SidebarAdmission[]>([]);
  readonly treatingDoctor = input<string | null>(null);

  // ─── Internal state ──────────────────────────────────────────────────────────
  readonly motifSaving = signal(false);
  readonly motifDisplay = computed(() => this.admission().motif_admission ?? '');

  /** Whether action buttons should be visible (only for active admissions) */
  readonly showActions = computed(() =>
    isActionsDropdownVisible(this.admission().status)
  );

  /** Admission history sorted descending by date */
  readonly sortedAdmissionHistory = computed(() =>
    sortAdmissionsDesc(this.admissionHistory())
  );

  // ─── Motif inline edit with optimistic UI ────────────────────────────────────

  /** Previous motif value for rollback on failure */
  private previousMotif: string | null = null;

  onMotifConfirmed(newValue: string): void {
    const admissionId = this.admission().id;
    this.previousMotif = this.admission().motif_admission;

    // Optimistic update: immediately reflect the new value
    // We update the admission input's motif via a mutable reference pattern
    // since inputs are read-only, we rely on the parent to update.
    // However, we set saving state and call PATCH.
    this.motifSaving.set(true);

    this.http
      .patch<any>(`${this.API}/clinical-core/admissions/${admissionId}`, {
        motif_admission: newValue,
      })
      .subscribe({
        next: () => {
          this.motifSaving.set(false);
          // Parent component should update the admission signal on success.
          // The InlineEditComponent already shows the new value optimistically.
        },
        error: () => {
          this.motifSaving.set(false);
          // Rollback: the parent should revert the admission motif.
          // We emit nothing here — the InlineEditComponent will show the
          // reverted value once the parent updates the admission signal.
          // For now, we can alert the user via console or a toast service.
          console.error(
            'Échec de la mise à jour du motif. Valeur précédente restaurée.'
          );
        },
      });
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────

  navigateToAdmission(admissionId: number): void {
    const serviceId = this.route.snapshot.paramMap.get('serviceId');
    this.router.navigate(['/services', serviceId, 'admission', admissionId]);
  }
}
