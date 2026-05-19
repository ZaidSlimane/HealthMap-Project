import { Component, ChangeDetectionStrategy, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumeTabComponent } from './tabs/resume-tab.component';
import { TraitementTabComponent, TreatmentEntry } from './tabs/traitement-tab.component';
import { ParcoursTabComponent, PatientMovement } from './tabs/parcours-tab.component';
import { ObsParamedicalTabComponent, ParamedicalObservation } from './tabs/obs-paramedical-tab.component';
import { VitalSignsPanelComponent, VitalSign } from './tabs/vital-signs-panel.component';

export type DossierTab = 'resume' | 'traitement' | 'parcours' | 'observation';

export interface TabDefinition {
  id: DossierTab;
  label: string;
}

export const DOSSIER_TABS: TabDefinition[] = [
  { id: 'resume', label: 'Résumé' },
  { id: 'traitement', label: 'Fiche de Traitement' },
  { id: 'parcours', label: 'Parcours' },
  { id: 'observation', label: 'Observation Paramedical' },
];

@Component({
  selector: 'app-main-tabbed-area',
  standalone: true,
  imports: [
    CommonModule,
    ResumeTabComponent,
    TraitementTabComponent,
    ParcoursTabComponent,
    ObsParamedicalTabComponent,
    VitalSignsPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tabbed-area">
      <nav class="tab-nav">
        @for (tab of tabs; track tab.id) {
          <button
            class="tab-btn"
            [class.active]="activeTab() === tab.id"
            (click)="setActiveTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        }
      </nav>

      <div class="tab-content">
        @switch (activeTab()) {
          @case ('resume') {
            <div class="tab-panel">
              <app-resume-tab [hasVitalSignsContent]="true">
                <app-vital-signs-panel
                  vitalSignsSlot
                  [vitalSigns]="vitalSigns()"
                  [admissionId]="admissionId()"
                  [patientId]="patientId()"
                />
              </app-resume-tab>
            </div>
          }
          @case ('traitement') {
            <div class="tab-panel">
              <app-traitement-tab [treatments]="treatments()" />
            </div>
          }
          @case ('parcours') {
            <div class="tab-panel">
              <app-parcours-tab [movements]="movements()" />
            </div>
          }
          @case ('observation') {
            <div class="tab-panel">
              <app-obs-paramedical-tab
                [observations]="observations()"
                [userRole]="userRole()"
              />
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .tabbed-area {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .tab-nav {
      display: flex;
      gap: 0;
      border-bottom: 2px solid var(--color-border, #e2e8f0);
      overflow-x: auto;
    }

    .tab-btn {
      padding: 10px 18px;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-muted, #64748b);
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
    }

    .tab-btn:hover {
      color: var(--color-primary, #00BCD4);
    }

    .tab-btn.active {
      color: var(--color-primary, #00BCD4);
      border-bottom-color: var(--color-primary, #00BCD4);
      font-weight: 600;
    }

    .tab-content {
      padding: 20px 0 0;
    }

    .tab-panel {
      min-height: 200px;
    }
  `]
})
export class MainTabbedAreaComponent {
  readonly tabs = DOSSIER_TABS;
  readonly activeTab = signal<DossierTab>('resume');

  // Inputs for ResumeTab / VitalSignsPanel
  readonly vitalSigns = input<VitalSign[]>([]);
  readonly admissionId = input<number>(0);
  readonly patientId = input<number>(0);

  // Inputs for TraitementTab
  readonly treatments = input<TreatmentEntry[]>([]);

  // Inputs for ParcoursTab
  readonly movements = input<PatientMovement[]>([]);

  // Inputs for ObsParamedicalTab
  readonly observations = input<ParamedicalObservation[]>([]);
  readonly userRole = input<string | null>(null);

  setActiveTab(tab: DossierTab): void {
    this.activeTab.set(tab);
  }
}
