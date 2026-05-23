import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface SectionCardItem {
  id?: number;
  label: string;
  date?: string;
}

export interface SectionCardConfig {
  id: string;
  title: string;
  icon: string;
  color: string;
  items: SectionCardItem[];
  route?: string;
  maxPreview?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-resume-tab',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="resume-grid">
      <!-- Left Column -->
      <div class="resume-column">
        @for (card of leftCards(); track card.id) {
          <div class="section-card">
            <div class="card-header" [style.border-left-color]="card.color">
              <span class="material-icons card-icon" [style.color]="card.color">{{ card.icon }}</span>
              <span class="card-title">{{ card.title }}</span>
              @if (card.route) {
                <button class="btn-drill" (click)="navigateTo(card.route!)" title="Voir tout">
                  <span class="material-icons">open_in_new</span>
                </button>
              }
            </div>
            <div class="card-body">
              @if (card.items.length === 0) {
                <p class="empty-state">Aucun enregistrement.</p>
              } @else {
                <ul class="preview-list">
                  @for (item of card.items.slice(0, card.maxPreview || 3); track item.label) {
                    <li class="preview-item">
                      <span class="item-dot" [style.background]="card.color"></span>
                      <span class="item-label">{{ item.label }}</span>
                      @if (item.date) {
                        <span class="item-date">{{ item.date | date:'dd/MM/yyyy' }}</span>
                      }
                    </li>
                  }
                </ul>
                @if (card.items.length > (card.maxPreview || 3)) {
                  <div class="more-indicator">+ {{ card.items.length - (card.maxPreview || 3) }} autres</div>
                }
              }
            </div>
            <div class="card-footer">
              <button class="btn-add" type="button">
                <span class="material-icons">add</span>
                Ajouter
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Center Column -->
      <div class="resume-column">
        @for (card of centerCards(); track card.id) {
          <div class="section-card">
            <div class="card-header" [style.border-left-color]="card.color">
              <span class="material-icons card-icon" [style.color]="card.color">{{ card.icon }}</span>
              <span class="card-title">{{ card.title }}</span>
              @if (card.route) {
                <button class="btn-drill" (click)="navigateTo(card.route!)" title="Voir tout">
                  <span class="material-icons">open_in_new</span>
                </button>
              }
            </div>
            <div class="card-body">
              @if (card.items.length === 0) {
                <p class="empty-state">Aucun enregistrement.</p>
              } @else {
                <ul class="preview-list">
                  @for (item of card.items.slice(0, card.maxPreview || 3); track item.label) {
                    <li class="preview-item">
                      <span class="item-dot" [style.background]="card.color"></span>
                      <span class="item-label">{{ item.label }}</span>
                      @if (item.date) {
                        <span class="item-date">{{ item.date | date:'dd/MM/yyyy' }}</span>
                      }
                    </li>
                  }
                </ul>
                @if (card.items.length > (card.maxPreview || 3)) {
                  <div class="more-indicator">+ {{ card.items.length - (card.maxPreview || 3) }} autres</div>
                }
              }
            </div>
            <div class="card-footer">
              <button class="btn-add" type="button">
                <span class="material-icons">add</span>
                Ajouter
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Right Column: Vital Signs pinned at top -->
      <div class="resume-column right-column">
        <ng-content select="[vitalSignsSlot]"></ng-content>

        @for (card of rightCards(); track card.id) {
          <div class="section-card">
            <div class="card-header" [style.border-left-color]="card.color">
              <span class="material-icons card-icon" [style.color]="card.color">{{ card.icon }}</span>
              <span class="card-title">{{ card.title }}</span>
              @if (card.route) {
                <button class="btn-drill" (click)="navigateTo(card.route!)" title="Voir tout">
                  <span class="material-icons">open_in_new</span>
                </button>
              }
            </div>
            <div class="card-body">
              @if (card.items.length === 0) {
                <p class="empty-state">Aucun enregistrement.</p>
              } @else {
                <ul class="preview-list">
                  @for (item of card.items.slice(0, card.maxPreview || 3); track item.label) {
                    <li class="preview-item">
                      <span class="item-dot" [style.background]="card.color"></span>
                      <span class="item-label">{{ item.label }}</span>
                      @if (item.date) {
                        <span class="item-date">{{ item.date | date:'dd/MM/yyyy' }}</span>
                      }
                    </li>
                  }
                </ul>
                @if (card.items.length > (card.maxPreview || 3)) {
                  <div class="more-indicator">+ {{ card.items.length - (card.maxPreview || 3) }} autres</div>
                }
              }
            </div>
            <div class="card-footer">
              <button class="btn-add" type="button">
                <span class="material-icons">add</span>
                Ajouter
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .resume-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      align-items: start;
    }

    @media (max-width: 1200px) {
      .resume-grid { grid-template-columns: 1fr 1fr; }
    }

    @media (max-width: 768px) {
      .resume-grid { grid-template-columns: 1fr; }
    }

    .resume-column {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    /* === Section Card === */
    .section-card {
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      background: var(--color-surface, #fff);
      overflow: hidden;
      transition: box-shadow 0.2s ease;
    }

    .section-card:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: var(--color-bg, #f8fafc);
      border-bottom: 1px solid var(--color-border, #e2e8f0);
      border-left: 3px solid transparent;
    }

    .card-icon {
      font-size: 18px;
    }

    .card-title {
      flex: 1;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-text, #0f172a);
    }

    .btn-drill {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border: none;
      border-radius: var(--radius-sm, 6px);
      background: transparent;
      color: var(--color-text-muted, #64748b);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-drill:hover {
      background: var(--color-surface-hover, #f1f5f9);
      color: var(--color-primary, #00BCD4);
    }

    .btn-drill .material-icons {
      font-size: 16px;
    }

    /* Card body */
    .card-body {
      padding: 10px 14px;
      min-height: 40px;
    }

    .empty-state {
      margin: 0;
      font-size: 12px;
      color: var(--color-text-muted, #94a3b8);
      font-style: italic;
    }

    .preview-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .preview-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--color-text, #0f172a);
    }

    .item-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .item-label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-date {
      font-size: 11px;
      color: var(--color-text-muted, #64748b);
      white-space: nowrap;
    }

    .more-indicator {
      margin-top: 6px;
      font-size: 11px;
      color: var(--color-text-muted, #64748b);
      font-style: italic;
    }

    /* Card footer */
    .card-footer {
      padding: 8px 14px;
      border-top: 1px solid var(--color-border, #e2e8f0);
    }

    .btn-add {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border: none;
      border-radius: var(--radius-sm, 6px);
      background: transparent;
      color: var(--color-primary, #00BCD4);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .btn-add:hover {
      background: rgba(0, 188, 212, 0.08);
    }

    .btn-add .material-icons {
      font-size: 14px;
    }
  `]
})
export class ResumeTabComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Data inputs for each section (preview items)
  readonly feuillesDeFlux = input<SectionCardItem[]>([]);
  readonly diagnostics = input<SectionCardItem[]>([]);
  readonly bilanPsychologique = input<SectionCardItem[]>([]);
  readonly antecedentsMedicaux = input<SectionCardItem[]>([]);
  readonly fichiers = input<SectionCardItem[]>([]);
  readonly observationsMedicales = input<SectionCardItem[]>([]);
  readonly allergies = input<SectionCardItem[]>([]);
  readonly medicaments = input<SectionCardItem[]>([]);
  readonly actesChirurgicaux = input<SectionCardItem[]>([]);
  readonly rendezVous = input<SectionCardItem[]>([]);
  readonly hasVitalSignsContent = input<boolean>(false);

  // ─── Card configurations ─────────────────────────────────────────────────────

  readonly leftCards = input<SectionCardConfig[]>([
    { id: 'feuilles-flux', title: 'Feuilles de Flux', icon: 'description', color: '#2563eb', items: [], route: 'feuilles-flux' },
    { id: 'diagnostic', title: 'Diagnostic', icon: 'medical_information', color: '#ea580c', items: [], route: 'diagnostic' },
    { id: 'bilan-psy', title: 'Bilan Psychologique', icon: 'psychology', color: '#7c3aed', items: [], route: 'bilan-psychologique' },
    { id: 'antecedents', title: 'Antécédents Médicaux', icon: 'history', color: '#0891b2', items: [], route: 'antecedents' },
    { id: 'fichiers', title: 'Fichiers', icon: 'folder', color: '#64748b', items: [], route: 'fichiers' },
  ]);

  readonly centerCards = input<SectionCardConfig[]>([
    { id: 'observations', title: 'Observations Médicales', icon: 'edit_note', color: '#16a34a', items: [], route: 'observations' },
    { id: 'allergies', title: 'Allergies', icon: 'warning', color: '#dc2626', items: [], route: 'allergies' },
    { id: 'medicaments', title: 'Médicaments', icon: 'medication', color: '#ca8a04', items: [], route: 'medicaments' },
  ]);

  readonly rightCards = input<SectionCardConfig[]>([
    { id: 'acte-chirurgical', title: 'Acte Chirurgical', icon: 'healing', color: '#be185d', items: [], route: 'actes-chirurgicaux' },
    { id: 'rendez-vous', title: 'Rendez-vous', icon: 'event', color: '#4f46e5', items: [], route: 'rendez-vous' },
  ]);

  // ─── Navigation ──────────────────────────────────────────────────────────────

  navigateTo(subRoute: string): void {
    const serviceId = this.route.snapshot.paramMap.get('serviceId');
    const admissionId = this.route.snapshot.paramMap.get('admissionId');
    this.router.navigate(['/services', serviceId, 'admission', admissionId, subRoute]);
  }
}
