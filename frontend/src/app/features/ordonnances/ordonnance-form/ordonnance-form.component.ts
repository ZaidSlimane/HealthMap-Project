import { Component, signal, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PatientService } from '../../../core/services/patient.service';
import { TypeDocument, Medicament } from '../../../core/models/ordonnance.model';

@Component({
  selector: 'app-ordonnance-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="of-page">
      <div class="of-header">
        <button class="btn-back" routerLink="/ordonnances"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <h1 class="of-title">Nouvelle ordonnance / document</h1>
          <p class="of-sub">{{ patientName() }}</p>
        </div>
      </div>

      <div class="of-layout">
        <!-- LEFT: Patient + type selector -->
        <aside class="of-left">
          <div class="of-patient-card">
            <div class="pc-avatar">{{ initials() }}</div>
            <div>
              <p class="pc-name">{{ patientName() }}</p>
              <p class="pc-medecin">Dr. Bennaoum Nour</p>
              <p class="pc-date">{{ today | date:'dd/MM/yyyy' }}</p>
            </div>
          </div>

          <div class="type-section">
            <p class="type-label">Type de document</p>
            <div class="type-chips">
              @for (t of typeOptions; track t.value) {
                <button type="button" class="type-chip"
                        [class.active]="selectedType() === t.value"
                        (click)="selectedType.set(t.value)">
                  <mat-icon>{{ t.icon }}</mat-icon> {{ t.label }}
                </button>
              }
            </div>
          </div>
        </aside>

        <!-- RIGHT: Dynamic form -->
        <div class="of-right">
          @if (selectedType() === 'ORDONNANCE') {
            <div class="of-section">
              <h3 class="of-section-title">Médicaments prescrits</h3>
              @for (med of medicaments(); track med; let i = $index) {
                <div class="med-row">
                  <div class="med-num">{{ i + 1 }}</div>
                  <div class="med-fields">
                    <input [(ngModel)]="med.nom" placeholder="Nom du médicament" class="med-input" />
                    <input [(ngModel)]="med.dosage" placeholder="Dosage (ex: 500mg)" class="med-input" />
                    <input [(ngModel)]="med.forme" placeholder="Forme (comprimé...)" class="med-input" />
                    <input [(ngModel)]="med.frequence" placeholder="Fréquence (2×/jour)" class="med-input" />
                    <input [(ngModel)]="med.duree" placeholder="Durée (7 jours)" class="med-input" />
                    <input [(ngModel)]="med.quantite" type="number" placeholder="Qté" class="med-input med-qty" />
                  </div>
                  <button class="med-remove" (click)="removeMed(i)"><mat-icon>close</mat-icon></button>
                </div>
              }
              <button class="btn-add-med" (click)="addMed()">
                <mat-icon>add</mat-icon> Ajouter un médicament
              </button>
              <div class="of-field">
                <label>Durée totale du traitement (jours)</label>
                <input type="number" [(ngModel)]="dureeTraitement" class="field-input" />
              </div>
              <div class="of-field">
                <label>Notes</label>
                <textarea [(ngModel)]="notes" rows="3" class="field-input" placeholder="Instructions particulières..."></textarea>
              </div>
            </div>
          }

          @if (selectedType() === 'CERTIFICAT') {
            <div class="of-section">
              <h3 class="of-section-title">Certificat médical</h3>
              <div class="of-field">
                <label>Type de certificat</label>
                <select [(ngModel)]="certType" class="field-input">
                  <option value="repos">Certificat de repos</option>
                  <option value="aptitude">Certificat d'aptitude</option>
                  <option value="deces">Constat de décès</option>
                </select>
              </div>
              <div class="of-field">
                <label>Durée (si repos — jours)</label>
                <input type="number" [(ngModel)]="dureeTraitement" class="field-input" />
              </div>
              <div class="of-field">
                <label>Motif</label>
                <textarea [(ngModel)]="notes" rows="4" class="field-input" placeholder="Motif médical..."></textarea>
              </div>
            </div>
          }

          @if (selectedType() === 'BON_EXAMEN' || selectedType() === 'BON_RADIO') {
            <div class="of-section">
              <h3 class="of-section-title">{{ selectedType() === 'BON_EXAMEN' ? 'Bilan biologique' : 'Imagerie médicale' }}</h3>
              <div class="exam-checks">
                @for (exam of (selectedType() === 'BON_EXAMEN' ? bilanOptions : radioOptions); track exam) {
                  <label class="check-item">
                    <input type="checkbox" /> {{ exam }}
                  </label>
                }
              </div>
              <div class="of-field">
                <label>Indication clinique</label>
                <textarea [(ngModel)]="notes" rows="3" class="field-input" placeholder="Indication..."></textarea>
              </div>
            </div>
          }

          @if (selectedType() === 'ARRET_TRAVAIL') {
            <div class="of-section">
              <h3 class="of-section-title">Arrêt de travail</h3>
              <div class="form-row">
                <div class="of-field">
                  <label>Durée (jours)</label>
                  <input type="number" [(ngModel)]="dureeTraitement" class="field-input" />
                </div>
                <div class="of-field">
                  <label>Date de début</label>
                  <input type="date" [(ngModel)]="dateDebut" class="field-input" />
                </div>
              </div>
              <div class="of-field">
                <label>Motif médical</label>
                <textarea [(ngModel)]="notes" rows="3" class="field-input" placeholder="Pathologie justifiant l'arrêt..."></textarea>
              </div>
            </div>
          }

          <div class="of-footer">
            <button class="btn-preview"><mat-icon>preview</mat-icon> Prévisualiser</button>
            <button class="btn-save"><mat-icon>save</mat-icon> Enregistrer</button>
            <button class="btn-print" (click)="imprimer()"><mat-icon>print</mat-icon> Imprimer directement</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .of-page { padding: var(--space-6); }
    .of-header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-6); }
    .btn-back { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 6px; cursor: pointer; display: flex; }
    .of-title { font-size: 20px; font-weight: 700; margin: 0; color: var(--color-text); }
    .of-sub { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; }
    .of-layout { display: grid; grid-template-columns: 260px 1fr; gap: var(--space-5); align-items: start; }
    .of-left { display: flex; flex-direction: column; gap: var(--space-4); }
    .of-patient-card { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-4); box-shadow: var(--shadow-md); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); text-align: center; }
    .pc-avatar { width: 64px; height: 64px; border-radius: 50%; background: var(--color-primary); color: #fff; font-size: 22px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
    .pc-name { font-size: 15px; font-weight: 700; margin: 0; color: var(--color-text); }
    .pc-medecin, .pc-date { font-size: 12px; color: var(--color-text-muted); margin: 0; }
    .type-section { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-4); box-shadow: var(--shadow-md); }
    .type-label { font-size: 12px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin: 0 0 var(--space-3); }
    .type-chips { display: flex; flex-direction: column; gap: var(--space-2); }
    .type-chip { display: flex; align-items: center; gap: var(--space-2); padding: 8px var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--color-border); background: transparent; font-size: 12px; cursor: pointer; color: var(--color-text-muted); transition: all 0.15s; text-align: left; mat-icon { font-size: 16px; } &.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); } }
    .of-right { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-md); }
    .of-section { display: flex; flex-direction: column; gap: var(--space-4); }
    .of-section-title { font-size: 14px; font-weight: 700; color: var(--color-text); margin: 0 0 var(--space-2); padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-border); }
    .med-row { display: flex; align-items: flex-start; gap: var(--space-3); }
    .med-num { width: 24px; height: 24px; border-radius: 50%; background: var(--color-primary); color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 8px; }
    .med-fields { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-2); flex: 1; }
    .med-input { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 8px var(--space-3); font-size: 12px; background: var(--color-background); color: var(--color-text); width: 100%; box-sizing: border-box; &:focus { outline: none; border-color: var(--color-primary); } &.med-qty { grid-column: auto; } }
    .med-remove { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 4px; cursor: pointer; color: var(--color-text-muted); display: flex; margin-top: 6px; mat-icon { font-size: 16px; } &:hover { color: var(--color-urgent); border-color: var(--color-urgent); } }
    .btn-add-med { display: inline-flex; align-items: center; gap: var(--space-2); background: transparent; border: 1px dashed var(--color-primary); border-radius: var(--radius-md); padding: 8px var(--space-4); font-size: 13px; color: var(--color-primary); cursor: pointer; mat-icon { font-size: 16px; } &:hover { background: rgba(0,188,212,0.05); } }
    .of-field { display: flex; flex-direction: column; gap: var(--space-2); label { font-size: 12px; font-weight: 600; color: var(--color-text-muted); } }
    .field-input { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px var(--space-3); font-size: 13px; background: var(--color-background); color: var(--color-text); font-family: var(--font-body); width: 100%; box-sizing: border-box; resize: vertical; &:focus { outline: none; border-color: var(--color-primary); } }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
    .exam-checks { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); }
    .check-item { display: flex; align-items: center; gap: var(--space-2); font-size: 13px; cursor: pointer; }
    .of-footer { display: flex; gap: var(--space-3); margin-top: var(--space-5); padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
    .btn-preview { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px var(--space-4); font-size: 13px; cursor: pointer; color: var(--color-text-muted); display: inline-flex; align-items: center; gap: var(--space-2); mat-icon { font-size: 16px; } }
    .btn-save { background: transparent; border: 1px solid var(--color-primary); border-radius: var(--radius-md); padding: 10px var(--space-4); font-size: 13px; cursor: pointer; color: var(--color-primary); font-weight: 600; display: inline-flex; align-items: center; gap: var(--space-2); mat-icon { font-size: 16px; } }
    .btn-print { background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: var(--space-2); mat-icon { font-size: 16px; } }
  `]
})
export class OrdonnanceFormComponent implements OnInit {
  private patientSvc = inject(PatientService);
  private route = inject(ActivatedRoute);

  selectedType = signal<TypeDocument>('ORDONNANCE');
  medicaments = signal<Medicament[]>([{ nom: '', dosage: '', forme: 'comprimé', frequence: '2×/jour', duree: '7 jours', quantite: 1 }]);
  patientId = signal<string>('1');
  dureeTraitement = 7;
  notes = '';
  certType = 'repos';
  dateDebut = new Date().toISOString().split('T')[0];
  today = new Date();

  bilanOptions = ['NFS', 'CRP', 'Glycémie à jeun', 'Créatinine', 'ECBU', 'Uricémie', 'Bilan lipidique', 'ASAT/ALAT'];
  radioOptions = ['Rx Thorax face', 'Rx Abdomen ASP', 'Échographie abdominale', 'TDM cérébral', 'IRM lombaire', 'Échographie cardiaque'];

  typeOptions: { value: TypeDocument; label: string; icon: string }[] = [
    { value: 'ORDONNANCE', label: 'Ordonnance', icon: 'medication' },
    { value: 'CERTIFICAT', label: 'Certificat', icon: 'fact_check' },
    { value: 'BON_EXAMEN', label: 'Bon examen', icon: 'science' },
    { value: 'BON_RADIO', label: 'Bon radiologie', icon: 'radiology' },
    { value: 'ARRET_TRAVAIL', label: 'Arrêt de travail', icon: 'event_busy' },
  ];

  patientName = signal<string>('');
  initials = signal<string>('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('patientId') ?? '1';
    this.patientId.set(id);
    const p = this.patientSvc.getPatient(+id);
    if (p) {
      this.patientName.set(p.fullName);
      this.initials.set(p.fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2));
    }
  }

  addMed(): void {
    this.medicaments.update(meds => [...meds, { nom: '', dosage: '', forme: 'comprimé', frequence: '1×/jour', duree: '7 jours', quantite: 1 }]);
  }

  removeMed(i: number): void {
    this.medicaments.update(meds => meds.filter((_, idx) => idx !== i));
  }

  imprimer(): void { window.print(); }
}
