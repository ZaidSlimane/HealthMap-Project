import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MockDataService } from '../../../core/services/mock-data.service';
import { PatientService } from '../../../core/services/patient.service';
import { Consultation } from '../../../core/models/consultation.model';

@Component({
  selector: 'app-consultation-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="consultation-workspace">
      <!-- LEFT PANEL: Patient queue -->
      <aside class="patient-queue">
        <div class="queue-header">
          <button class="btn-teal" (click)="appellerSuivant()">
            <mat-icon>call</mat-icon> Appeler suivant
          </button>
          <div class="queue-search">
            <mat-icon>search</mat-icon>
            <input [(ngModel)]="searchText" placeholder="Rechercher patient..." />
          </div>
        </div>
        <div class="queue-stats">
          <span class="qs-badge qs-attente">{{ enAttenteCount() }} en attente</span>
          <span class="qs-badge qs-cours">{{ enCoursCount() }} en cours</span>
        </div>
        <ul class="queue-list">
          @for (c of filteredQueue(); track c.id) {
            <li class="queue-item"
                [class.active]="activeConsultationId() === c.id"
                [class.urgent]="isUrgent(c)"
                (click)="selectConsultation(c)">
              <div class="qi-avatar">{{ getInitials(c) }}</div>
              <div class="qi-info">
                <span class="qi-name">{{ getPatientName(c.patientId) }}</span>
                <span class="qi-motif">{{ c.motif }}</span>
                <span class="qi-meta">{{ c.dateHeure | date:'HH:mm' }}</span>
              </div>
              <span class="qi-statut" [class]="'statut-' + c.statut.toLowerCase()">
                {{ statutLabel(c.statut) }}
              </span>
            </li>
          }
          @empty {
            <li class="queue-empty">
              <mat-icon>inbox</mat-icon>
              <p>Aucun patient trouvé</p>
            </li>
          }
        </ul>
      </aside>

      <!-- RIGHT PANEL: Workspace -->
      <section class="workspace-panel">
        @if (activeConsultation()) {
          <div class="patient-context-bar">
            <div class="pcb-avatar">{{ getInitials(activeConsultation()!) }}</div>
            <div class="pcb-info">
              <h2 class="pcb-name">{{ getPatientName(activeConsultation()!.patientId) }}</h2>
              <div class="pcb-meta">
                <span>Motif: {{ activeConsultation()!.motif }}</span>
                <span class="pcb-sep">·</span>
                <span>{{ activeConsultation()!.dateHeure | date:'dd/MM/yyyy HH:mm' }}</span>
                <span class="pcb-sep">·</span>
                <span>{{ activeConsultation()!.medecin }}</span>
              </div>
            </div>
            <div class="pcb-actions">
              <button class="btn-outline-sm" (click)="voirDetail(activeConsultation()!.id)">
                <mat-icon>open_in_new</mat-icon> Détail
              </button>
              <span class="statut-chip" [class]="'statut-' + activeConsultation()!.statut.toLowerCase()">
                {{ statutLabel(activeConsultation()!.statut) }}
              </span>
            </div>
          </div>

          <div class="ws-tabs">
            @for (tab of tabs; track tab.id) {
              <button class="ws-tab" [class.active]="activeTab() === tab.id" (click)="activeTab.set(tab.id)">
                {{ tab.label }}
              </button>
            }
          </div>

          <div class="ws-content">
            @if (activeTab() === 'consultation') {
              <div class="ws-section">
                <h3 class="ws-section-title">Anamnèse</h3>
                <textarea class="ws-textarea" rows="4" [value]="activeConsultation()!.anamnese || ''" placeholder="Antécédents, histoire de la maladie..."></textarea>
              </div>
              <div class="ws-section">
                <h3 class="ws-section-title">Examen clinique</h3>
                <textarea class="ws-textarea" rows="4" [value]="activeConsultation()!.examenClinique || ''" placeholder="Signes vitaux, auscultation..."></textarea>
              </div>
              <div class="ws-section">
                <h3 class="ws-section-title">Diagnostic</h3>
                <textarea class="ws-textarea" rows="3" [value]="activeConsultation()!.diagnosticPrincipal || ''" placeholder="Diagnostic principal..."></textarea>
                <div class="cim-search-wrap">
                  <mat-icon class="cim-icon">local_hospital</mat-icon>
                  <input class="cim-input" [(ngModel)]="cim10Search" placeholder="Rechercher code CIM-10..." (input)="onCimSearch()" />
                </div>
                @if (cimResults().length > 0) {
                  <ul class="cim-dropdown">
                    @for (code of cimResults(); track code.code) {
                      <li class="cim-option" (click)="addCimCode(code.code + ' — ' + code.libelle)">
                        <strong>{{ code.code }}</strong> {{ code.libelle }}
                      </li>
                    }
                  </ul>
                }
                <div class="cim-chips">
                  @for (chip of selectedCodes(); track chip) {
                    <span class="cim-chip">{{ chip }} <button (click)="removeCimCode(chip)">×</button></span>
                  }
                </div>
              </div>
              <div class="ws-section">
                <h3 class="ws-section-title">Orientation</h3>
                <select class="ws-select">
                  <option value="">Sélectionner l'orientation...</option>
                  <option value="hospitalise">Hospitalisé</option>
                  <option value="refere">Référé</option>
                  <option value="sortie">Sortie</option>
                </select>
              </div>
              <div class="ws-actions">
                <button class="btn-teal">
                  <mat-icon>save</mat-icon> Sauvegarder
                </button>
                <button class="btn-outline">
                  <mat-icon>description</mat-icon> Prescrire
                </button>
                <button class="btn-outline">
                  <mat-icon>science</mat-icon> Demander examen
                </button>
              </div>
              <div class="ws-footer">
                <button class="btn-danger-outline">
                  <mat-icon>check_circle</mat-icon> Terminer la consultation
                </button>
              </div>
            }
            @if (activeTab() === 'antecedents') {
              <div class="ws-empty-tab">
                <mat-icon>history</mat-icon>
                <p>Antécédents médicaux et chirurgicaux du patient</p>
                <span>Dossier médical complet disponible dans la fiche patient</span>
              </div>
            }
            @if (activeTab() === 'examens') {
              <div class="ws-empty-tab">
                <mat-icon>biotech</mat-icon>
                <p>Examens complémentaires demandés</p>
                <span>Aucun examen enregistré pour cette consultation</span>
              </div>
            }
            @if (activeTab() === 'ordonnances') {
              <div class="ws-empty-tab">
                <mat-icon>description</mat-icon>
                <p>Ordonnances de cette consultation</p>
                <button class="btn-teal" style="margin-top:var(--space-4)">
                  <mat-icon>add</mat-icon> Nouvelle ordonnance
                </button>
              </div>
            }
          </div>
        } @else {
          <div class="ws-empty">
            <mat-icon>stethoscope</mat-icon>
            <h3>Aucune consultation sélectionnée</h3>
            <p>Sélectionnez un patient dans la file d'attente ou démarrez une nouvelle consultation.</p>
            <button class="btn-teal" routerLink="nouvelle">
              <mat-icon>add</mat-icon> Nouvelle consultation
            </button>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .consultation-workspace {
      display: grid;
      grid-template-columns: 300px 1fr;
      height: calc(100vh - var(--header-height));
      gap: 0;
      overflow: hidden;
    }
    .patient-queue {
      border-right: 1px solid var(--color-border);
      overflow-y: auto;
      background: var(--color-surface);
      display: flex; flex-direction: column;
    }
    .queue-header {
      padding: var(--space-3);
      border-bottom: 1px solid var(--color-border);
      display: flex; flex-direction: column; gap: var(--space-2);
    }
    .queue-search {
      display: flex; align-items: center; gap: var(--space-2);
      background: var(--color-background); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); padding: 6px var(--space-3);
      mat-icon { font-size: 18px; color: var(--color-text-muted); }
      input { border: none; background: transparent; outline: none; width: 100%; font-size: 13px; color: var(--color-text); }
    }
    .queue-stats {
      display: flex; gap: var(--space-2); padding: var(--space-2) var(--space-3);
    }
    .qs-badge {
      font-size: 11px; font-weight: 600; padding: 2px 8px;
      border-radius: var(--radius-full);
      &.qs-attente { background: rgba(255,152,0,0.12); color: #E65100; }
      &.qs-cours { background: rgba(0,188,212,0.12); color: var(--color-primary); }
    }
    .queue-list { list-style: none; padding: 0; margin: 0; flex: 1; }
    .queue-item {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-3); border-bottom: 1px solid var(--color-border);
      cursor: pointer; transition: background 0.15s;
      &:hover { background: var(--color-background); }
      &.active { background: rgba(0,188,212,0.08); border-left: 3px solid var(--color-primary); }
      &.urgent { border-left: 3px solid #E53935; }
    }
    .qi-avatar {
      width: 38px; height: 38px; border-radius: 50%;
      background: var(--color-primary); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px; flex-shrink: 0;
    }
    .qi-info { flex: 1; min-width: 0; }
    .qi-name { display: block; font-weight: 600; font-size: 13px; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .qi-motif { display: block; font-size: 11px; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .qi-meta { display: block; font-size: 10px; color: var(--color-text-muted); margin-top: 2px; }
    .qi-statut { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: var(--radius-full); flex-shrink: 0; }
    .queue-empty { display: flex; flex-direction: column; align-items: center; padding: var(--space-10); color: var(--color-text-muted); text-align: center; mat-icon { font-size: 32px; } }
    .workspace-panel {
      display: flex; flex-direction: column;
      overflow: hidden; background: var(--color-background);
    }
    .patient-context-bar {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-3) var(--space-5);
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
    }
    .pcb-avatar {
      width: 44px; height: 44px; border-radius: 50%;
      background: var(--color-primary); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 16px; flex-shrink: 0;
    }
    .pcb-info { flex: 1; }
    .pcb-name { font-size: 16px; font-weight: 700; color: var(--color-text); margin: 0; }
    .pcb-meta { font-size: 12px; color: var(--color-text-muted); display: flex; gap: 6px; flex-wrap: wrap; margin-top: 2px; }
    .pcb-sep { color: var(--color-border-strong); }
    .pcb-actions { display: flex; align-items: center; gap: var(--space-2); }
    .ws-tabs {
      display: flex; gap: 0; border-bottom: 1px solid var(--color-border);
      background: var(--color-surface); flex-shrink: 0;
    }
    .ws-tab {
      padding: var(--space-3) var(--space-5); border: none; background: transparent;
      font-size: 13px; font-weight: 500; color: var(--color-text-muted);
      cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s;
      &.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }
      &:hover:not(.active) { background: var(--color-background); }
    }
    .ws-content { flex: 1; overflow-y: auto; padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); }
    .ws-section { display: flex; flex-direction: column; gap: var(--space-2); }
    .ws-section-title { font-size: 13px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
    .ws-textarea {
      width: 100%; border: 1px solid var(--color-border); border-radius: var(--radius-md);
      padding: var(--space-3); font-size: 13px; font-family: var(--font-body);
      color: var(--color-text); background: var(--color-surface); resize: vertical;
      &:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(0,188,212,0.1); }
    }
    .ws-select {
      width: 100%; border: 1px solid var(--color-border); border-radius: var(--radius-md);
      padding: var(--space-3); font-size: 13px; color: var(--color-text);
      background: var(--color-surface); cursor: pointer;
      &:focus { outline: none; border-color: var(--color-primary); }
    }
    .cim-search-wrap {
      display: flex; align-items: center; gap: var(--space-2);
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); padding: 8px var(--space-3); margin-top: var(--space-2);
    }
    .cim-icon { color: var(--color-primary); font-size: 18px; }
    .cim-input { border: none; background: transparent; outline: none; flex: 1; font-size: 13px; color: var(--color-text); }
    .cim-dropdown {
      list-style: none; padding: 0; margin: 0;
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); max-height: 160px; overflow-y: auto;
      box-shadow: var(--shadow-md);
    }
    .cim-option {
      padding: var(--space-2) var(--space-3); font-size: 12px; cursor: pointer;
      border-bottom: 1px solid var(--color-border);
      &:hover { background: rgba(0,188,212,0.06); }
      strong { color: var(--color-primary); margin-right: 6px; }
    }
    .cim-chips { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-2); }
    .cim-chip {
      background: rgba(0,188,212,0.1); color: var(--color-primary);
      border-radius: var(--radius-full); padding: 3px 10px; font-size: 12px; font-weight: 600;
      display: flex; align-items: center; gap: 4px;
      button { background: transparent; border: none; color: inherit; cursor: pointer; font-size: 14px; padding: 0; line-height: 1; }
    }
    .ws-actions { display: flex; gap: var(--space-3); padding-top: var(--space-4); border-top: 1px solid var(--color-border); flex-wrap: wrap; }
    .ws-footer { display: flex; justify-content: flex-end; padding-top: var(--space-2); }
    .ws-empty {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: var(--space-3); color: var(--color-text-muted);
      text-align: center; padding: var(--space-10);
      mat-icon { font-size: 48px; color: var(--color-border-strong); }
      h3 { margin: 0; font-size: 18px; color: var(--color-text); }
      p { margin: 0; font-size: 14px; max-width: 360px; }
    }
    .ws-empty-tab {
      display: flex; flex-direction: column; align-items: center;
      gap: var(--space-3); padding: var(--space-10);
      color: var(--color-text-muted); text-align: center;
      mat-icon { font-size: 36px; }
      p { margin: 0; font-size: 16px; font-weight: 600; color: var(--color-text); }
      span { font-size: 13px; }
    }
    .statut-chip, .qi-statut {
      &.statut-en_attente { background: rgba(255,152,0,0.12); color: #E65100; }
      &.statut-en_cours { background: rgba(0,188,212,0.12); color: var(--color-primary); }
      &.statut-terminee { background: rgba(76,175,80,0.12); color: #2E7D32; }
      &.statut-annulee { background: rgba(158,158,158,0.15); color: #616161; }
    }
    .btn-teal {
      display: inline-flex; align-items: center; gap: var(--space-2);
      background: var(--color-primary); color: #fff; border: none;
      border-radius: var(--radius-md); padding: 8px var(--space-4);
      font-size: 13px; font-weight: 600; cursor: pointer;
      mat-icon { font-size: 16px; }
      &:hover { background: var(--color-primary-hover); }
    }
    .btn-outline {
      display: inline-flex; align-items: center; gap: var(--space-2);
      background: transparent; color: var(--color-text); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); padding: 8px var(--space-4);
      font-size: 13px; font-weight: 500; cursor: pointer;
      mat-icon { font-size: 16px; }
      &:hover { background: var(--color-background); }
    }
    .btn-outline-sm {
      display: inline-flex; align-items: center; gap: 4px;
      background: transparent; color: var(--color-text-muted); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); padding: 5px var(--space-3); font-size: 12px; cursor: pointer;
      mat-icon { font-size: 14px; }
    }
    .btn-danger-outline {
      display: inline-flex; align-items: center; gap: var(--space-2);
      background: transparent; color: var(--color-urgent); border: 1px solid var(--color-urgent);
      border-radius: var(--radius-md); padding: 8px var(--space-4);
      font-size: 13px; font-weight: 600; cursor: pointer;
      mat-icon { font-size: 16px; }
      &:hover { background: var(--color-urgent-bg); }
    }
  `]
})
export class ConsultationListComponent {
  private mockData = inject(MockDataService);
  private patientSvc = inject(PatientService);
  private router = inject(Router);

  searchText = '';
  cim10Search = '';
  activeConsultationId = signal<string | null>(null);
  activeTab = signal<string>('consultation');
  selectedCodes = signal<string[]>([]);
  cimResults = signal<{ code: string; libelle: string }[]>([]);

  tabs = [
    { id: 'consultation', label: 'Consultation' },
    { id: 'antecedents', label: 'Antécédents' },
    { id: 'examens', label: 'Examens' },
    { id: 'ordonnances', label: 'Ordonnances' },
  ];

  allConsultations = signal(
    this.mockData.getConsultations().filter(c => c.statut !== 'ANNULEE')
  );

  filteredQueue = computed(() => {
    const q = this.searchText.toLowerCase();
    const list = this.allConsultations();
    return list.filter(c => {
      // Note: search on patient name is now tricky because it's async.
      // For now, we search on motif. Full patient search requires a different approach.
      return !q || c.motif.toLowerCase().includes(q);
    }).sort((a, b) => {
      const urgOrder = (c: Consultation) => c.statut === 'EN_COURS' ? 0 : c.statut === 'EN_ATTENTE' ? 1 : 2;
      return urgOrder(a) - urgOrder(b);
    });
  });

  enAttenteCount = computed(() => this.allConsultations().filter(c => c.statut === 'EN_ATTENTE').length);
  enCoursCount = computed(() => this.allConsultations().filter(c => c.statut === 'EN_COURS').length);

  activeConsultation = computed(() => {
    const id = this.activeConsultationId();
    return id ? this.allConsultations().find(c => c.id === id) ?? null : null;
  });

  getPatientName(patientId: string): string {
    const p = this.patientSvc.getPatient(+patientId);
    return p ? p.fullName : `Patient #${patientId}`;
  }

  getInitials(c: Consultation): string {
    const name = this.getPatientName(c.patientId);
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  isUrgent(c: Consultation): boolean {
    return c.motif.toLowerCase().includes('urgence') || c.motif.toLowerCase().includes('douleur thoracique');
  }

  statutLabel(s: string): string {
    const m: Record<string, string> = { EN_ATTENTE: 'Attente', EN_COURS: 'En cours', TERMINEE: 'Terminée', ANNULEE: 'Annulée' };
    return m[s] ?? s;
  }

  selectConsultation(c: Consultation): void {
    this.activeConsultationId.set(c.id);
    this.activeTab.set('consultation');
    this.selectedCodes.set(c.cim10Code ? [c.cim10Code] : []);
  }

  appellerSuivant(): void {
    const next = this.allConsultations().find(c => c.statut === 'EN_ATTENTE');
    if (next) this.selectConsultation(next);
  }

  onCimSearch(): void {
    const results = this.mockData.searchCIM10(this.cim10Search);
    this.cimResults.set(results.slice(0, 6));
  }

  addCimCode(code: string): void {
    if (!this.selectedCodes().includes(code)) {
      this.selectedCodes.update(codes => [...codes, code]);
    }
    this.cimResults.set([]);
    this.cim10Search = '';
  }

  removeCimCode(code: string): void {
    this.selectedCodes.update(codes => codes.filter(c => c !== code));
  }

  voirDetail(id: string): void {
    this.router.navigate(['/consultations', id]);
  }
}
