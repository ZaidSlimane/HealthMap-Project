import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  computed,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RadioService } from '../../radiology/services/radio.service';
import { LaboService } from '../../laboratory/services/labo.service';

interface CatalogItem {
  id: number;
  name: string;
  type?: string;
}

@Component({
  selector: 'app-exam-request-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible) {
      <div class="modal-overlay" (click)="close()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="modal-header">
            <h2 class="modal-title">{{ modalTitle() }}</h2>
            <button class="btn-close" (click)="close()" aria-label="Fermer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <!-- Search -->
          <div class="modal-search">
            <span class="material-icons search-icon">search</span>
            <input
              type="text"
              class="search-input"
              [placeholder]="'Rechercher un examen...'"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
            />
          </div>

          <!-- Scrollable list -->
          <div class="modal-body">
            @if (loading()) {
              <div class="loading-state">
                <div class="spinner-ring"></div>
                <span>Chargement du catalogue...</span>
              </div>
            } @else if (filteredItems().length === 0) {
              <div class="empty-state">
                <span class="material-icons">search_off</span>
                <p>Aucun examen trouvé</p>
              </div>
            } @else {
              @for (item of filteredItems(); track item.id) {
                <label class="checkbox-item">
                  <input
                    type="checkbox"
                    [checked]="isSelected(item)"
                    (change)="toggleItem(item)"
                  />
                  <span class="checkbox-mark"></span>
                  <span class="checkbox-label">{{ item.name }}</span>
                  @if (item.type) {
                    <span class="item-type-badge">{{ item.type }}</span>
                  }
                </label>
              }
            }
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <div class="footer-info">
              <span class="selected-count">{{ selectedItems().length }} sélectionné(s)</span>
              @if (validationError()) {
                <span class="validation-error">{{ validationError() }}</span>
              }
            </div>

            <div class="urgency-group">
              <label class="radio-label">
                <input
                  type="radio"
                  name="urgency"
                  value="normale"
                  [checked]="urgency() === 'normale'"
                  (change)="urgency.set('normale')"
                />
                <span class="radio-mark"></span>
                Normal
              </label>
              <label class="radio-label">
                <input
                  type="radio"
                  name="urgency"
                  value="urgente"
                  [checked]="urgency() === 'urgente'"
                  (change)="urgency.set('urgente')"
                />
                <span class="radio-mark"></span>
                Urgente
              </label>
            </div>

            <textarea
              class="notes-input"
              placeholder="Notes cliniques (optionnel)..."
              [ngModel]="notes()"
              (ngModelChange)="notes.set($event)"
              rows="2"
            ></textarea>

            <div class="footer-actions">
              <button class="btn-cancel" (click)="close()">Annuler</button>
              <button
                class="btn-submit"
                [disabled]="submitting()"
                (click)="submit()"
              >
                @if (submitting()) {
                  <div class="btn-spinner"></div>
                }
                Envoyer la demande
              </button>
            </div>
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
      max-width: 600px;
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
      border-radius: var(--radius-sm, 6px);
      color: var(--color-text-muted, #64748b);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-close:hover {
      background: var(--color-surface-alt, #f1f5f9);
      color: var(--color-text, #0f172a);
    }

    .modal-search {
      position: relative;
      padding: 16px 24px;
      border-bottom: 1px solid var(--color-border, #e2e8f0);
    }

    .search-icon {
      position: absolute;
      left: 36px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 20px;
      color: var(--color-text-muted, #64748b);
    }

    .search-input {
      width: 100%;
      padding: 10px 12px 10px 40px;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      font-size: 14px;
      color: var(--color-text, #0f172a);
      background: var(--color-surface-alt, #f8fafc);
      outline: none;
      transition: border-color 0.2s ease;
    }

    .search-input:focus {
      border-color: var(--color-primary, #00BCD4);
      background: var(--color-surface, #fff);
    }

    .search-input::placeholder {
      color: var(--color-text-muted, #64748b);
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px 24px;
      min-height: 200px;
      max-height: 300px;
    }

    .loading-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 40px 16px;
      color: var(--color-text-muted, #64748b);
      font-size: 14px;
    }

    .empty-state .material-icons {
      font-size: 36px;
      opacity: 0.5;
    }

    .spinner-ring {
      width: 28px;
      height: 28px;
      border: 3px solid rgba(0, 188, 212, 0.15);
      border-top-color: var(--color-primary, #00BCD4);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: var(--radius-sm, 6px);
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .checkbox-item:hover {
      background: var(--color-surface-alt, #f8fafc);
    }

    .checkbox-item input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: var(--color-primary, #00BCD4);
      cursor: pointer;
    }

    .checkbox-mark {
      display: none;
    }

    .checkbox-label {
      flex: 1;
      font-size: 14px;
      color: var(--color-text, #0f172a);
    }

    .item-type-badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 12px;
      background: rgba(0, 188, 212, 0.08);
      color: var(--color-primary, #00BCD4);
      font-weight: 500;
      text-transform: capitalize;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--color-border, #e2e8f0);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .footer-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .selected-count {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-primary, #00BCD4);
    }

    .validation-error {
      font-size: 12px;
      color: #dc2626;
      font-weight: 500;
    }

    .urgency-group {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .radio-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: var(--color-text, #0f172a);
      cursor: pointer;
    }

    .radio-label input[type="radio"] {
      width: 16px;
      height: 16px;
      accent-color: var(--color-primary, #00BCD4);
      cursor: pointer;
    }

    .radio-mark {
      display: none;
    }

    .notes-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      font-size: 13px;
      color: var(--color-text, #0f172a);
      background: var(--color-surface-alt, #f8fafc);
      resize: vertical;
      outline: none;
      font-family: inherit;
      transition: border-color 0.2s ease;
    }

    .notes-input:focus {
      border-color: var(--color-primary, #00BCD4);
      background: var(--color-surface, #fff);
    }

    .notes-input::placeholder {
      color: var(--color-text-muted, #64748b);
    }

    .footer-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
    }

    .btn-cancel {
      padding: 10px 18px;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      background: var(--color-surface, #fff);
      color: var(--color-text-muted, #64748b);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-cancel:hover {
      border-color: var(--color-text-muted, #64748b);
      color: var(--color-text, #0f172a);
    }

    .btn-submit {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border: none;
      border-radius: var(--radius-md, 10px);
      background: var(--color-primary, #00BCD4);
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .btn-submit:hover:not(:disabled) {
      background: var(--color-primary-dark, #0097A7);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.97);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ExamRequestModalComponent implements OnChanges {
  private readonly radioService = inject(RadioService);
  private readonly laboService = inject(LaboService);

  @Input() mode: 'radiology' | 'laboratory' = 'radiology';
  @Input() consultationId!: number;
  @Input() visible = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() requestSubmitted = new EventEmitter<void>();

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly searchTerm = signal('');
  readonly urgency = signal<'normale' | 'urgente'>('normale');
  readonly notes = signal('');
  readonly catalogItems = signal<CatalogItem[]>([]);
  readonly selectedItems = signal<CatalogItem[]>([]);
  readonly validationError = signal('');

  readonly modalTitle = computed(() =>
    this.mode === 'radiology'
      ? "Demande d'examen Radiologique"
      : "Demande d'examen Biologique"
  );

  readonly filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.catalogItems();
    return this.catalogItems().filter(item =>
      item.name.toLowerCase().includes(term)
    );
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetState();
      this.loadCatalog();
    }
  }

  isSelected(item: CatalogItem): boolean {
    return this.selectedItems().some(s => s.id === item.id && s.type === item.type);
  }

  toggleItem(item: CatalogItem): void {
    this.validationError.set('');
    const current = this.selectedItems();
    if (this.isSelected(item)) {
      this.selectedItems.set(current.filter(s => !(s.id === item.id && s.type === item.type)));
    } else {
      this.selectedItems.set([...current, item]);
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  submit(): void {
    if (!Number.isFinite(this.consultationId) || this.consultationId <= 0) {
      this.validationError.set('Identifiant de consultation invalide.');
      return;
    }

    if (this.selectedItems().length === 0) {
      this.validationError.set('Veuillez sélectionner au moins un examen.');
      return;
    }

    this.validationError.set('');
    this.submitting.set(true);

    if (this.mode === 'radiology') {
      this.submitRadiology();
    } else {
      this.submitLaboratory();
    }
  }

  private submitRadiology(): void {
    const payload = {
      consultation_id: this.consultationId,
      radiology_exam_type_ids: this.selectedItems().map(i => i.id),
      urgency: this.urgency(),
      notes: this.notes() || undefined,
    };

    this.radioService.createRequest(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.requestSubmitted.emit();
        this.close();
      },
      error: (err) => {
        this.submitting.set(false);
        this.validationError.set(this.getSubmitError(err, 'Erreur lors de la soumission. Veuillez réessayer.'));
      },
    });
  }

  private submitLaboratory(): void {
    const payload = {
      consultation_id: this.consultationId,
      items: this.selectedItems().map(i => ({
        item_type: i.type || 'analysis',
        item_id: i.id,
      })),
      urgency: this.urgency(),
      notes: this.notes() || undefined,
    };

    this.laboService.createRequest(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.requestSubmitted.emit();
        this.close();
      },
      error: (err) => {
        this.submitting.set(false);
        this.validationError.set(this.getSubmitError(err, 'Erreur lors de la soumission. Veuillez réessayer.'));
      },
    });
  }

  private loadCatalog(): void {
    this.loading.set(true);

    if (this.mode === 'radiology') {
      this.radioService.getExamTypes().subscribe({
        next: (items) => {
          this.catalogItems.set(
            items.map(i => ({ id: i.id, name: i.name || i.label || i.nom }))
          );
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.laboService.getCatalog().subscribe({
        next: (items) => {
          const mapped: CatalogItem[] = [];
          for (const item of items) {
            if (item.analyses) {
              // This is a panel (billon)
              mapped.push({ id: item.id, name: item.name || item.nom, type: 'panel' });
            } else {
              // Individual analysis
              mapped.push({ id: item.id, name: item.name || item.nom, type: 'analysis' });
            }
          }
          this.catalogItems.set(mapped);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  private resetState(): void {
    this.searchTerm.set('');
    this.urgency.set('normale');
    this.notes.set('');
    this.selectedItems.set([]);
    this.catalogItems.set([]);
    this.validationError.set('');
    this.submitting.set(false);
  }

  private getSubmitError(err: any, fallback: string): string {
    const message = err?.error?.message;
    const errors = err?.error?.errors ?? {};
    return message
      || errors.context?.[0]
      || errors.consultation_id?.[0]
      || errors.admission_id?.[0]
      || errors.radiology_exam_type_ids?.[0]
      || errors['radiology_exam_type_ids.0']?.[0]
      || errors.items?.[0]
      || fallback;
  }
}
