import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MockDataService } from '../../../core/services/mock-data.service';
import { PatientService } from '../../../core/services/patient.service';
import { Ordonnance } from '../../../core/models/ordonnance.model';

@Component({
  selector: 'app-ordonnance-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="od-page">
      @if (ordonnance()) {
        <div class="od-header">
          <button class="btn-back" routerLink="/ordonnances"><mat-icon>arrow_back</mat-icon></button>
          <div>
            <h1 class="od-title">{{ typeLabel(ordonnance()!.type) }}</h1>
            <p class="od-sub">{{ patientName() }} · {{ ordonnance()!.date | date:'dd/MM/yyyy' }}</p>
          </div>
          <div class="od-actions">
            <button class="btn-outline" [routerLink]="['/ordonnances', ordonnance()!.id, 'imprimer']"><mat-icon>print</mat-icon> Imprimer</button>
          </div>
        </div>

        <div class="od-card">
          <div class="od-meta-row">
            <div class="om-item"><span class="om-label">Médecin</span><span class="om-val">{{ ordonnance()!.medecin }}</span></div>
            <div class="om-item"><span class="om-label">Date</span><span class="om-val">{{ ordonnance()!.date | date:'dd/MM/yyyy' }}</span></div>
            <div class="om-item"><span class="om-label">Durée traitement</span><span class="om-val">{{ ordonnance()!.dureeTraitement ?? '—' }} jours</span></div>
            <div class="om-item"><span class="om-label">Imprimée</span><span class="om-val">{{ ordonnance()!.imprime ? 'Oui' : 'Non' }}</span></div>
          </div>

          @if (ordonnance()!.medicaments.length > 0) {
            <div class="od-section">
              <h3 class="od-section-title">Médicaments prescrits</h3>
              <div class="med-list">
                @for (m of ordonnance()!.medicaments; track m.nom; let i = $index) {
                  <div class="med-item">
                    <span class="med-num">{{ i + 1 }}</span>
                    <div class="med-body">
                      <strong>{{ m.nom }} {{ m.dosage }}</strong> — {{ m.forme }}
                      <br /><span class="med-posologie">{{ m.frequence }} pendant {{ m.duree }} — Qté: {{ m.quantite }}</span>
                      @if (m.instructions) { <br /><em class="med-instr">{{ m.instructions }}</em> }
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          @if (ordonnance()!.notes) {
            <div class="od-section">
              <h3 class="od-section-title">Notes</h3>
              <p class="od-notes">{{ ordonnance()!.notes }}</p>
            </div>
          }
        </div>
      } @else {
        <p class="not-found">Ordonnance introuvable</p>
      }
    </div>
  `,
  styles: [`
    .od-page { padding: var(--space-6); max-width: 800px; }
    .od-header { display: flex; align-items: flex-start; gap: var(--space-4); margin-bottom: var(--space-6); }
    .btn-back { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 6px; cursor: pointer; display: flex; }
    .od-title { font-size: 20px; font-weight: 700; margin: 0; }
    .od-sub { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; }
    .od-actions { margin-left: auto; }
    .btn-outline { display: inline-flex; align-items: center; gap: var(--space-2); background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 8px var(--space-4); font-size: 13px; cursor: pointer; mat-icon { font-size: 16px; } }
    .od-card { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-md); }
    .od-meta-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-5); padding-bottom: var(--space-4); border-bottom: 1px solid var(--color-border); }
    .om-item { .om-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 4px; } .om-val { font-size: 14px; font-weight: 600; color: var(--color-text); } }
    .od-section { margin-top: var(--space-4); }
    .od-section-title { font-size: 13px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 var(--space-3); }
    .med-list { display: flex; flex-direction: column; gap: var(--space-3); }
    .med-item { display: flex; gap: var(--space-3); align-items: flex-start; padding: var(--space-3); background: var(--color-background); border-radius: var(--radius-md); }
    .med-num { width: 24px; height: 24px; border-radius: 50%; background: var(--color-primary); color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .med-body { font-size: 13px; line-height: 1.7; color: var(--color-text); strong { color: var(--color-text); } }
    .med-posologie { color: var(--color-text-muted); }
    .med-instr { color: var(--color-primary); font-size: 12px; }
    .od-notes { font-size: 14px; color: var(--color-text); background: var(--color-background); padding: var(--space-3); border-radius: var(--radius-md); }
    .not-found { color: var(--color-text-muted); padding: var(--space-8); text-align: center; }
  `]
})
export class OrdonnanceDetailComponent implements OnInit {
  private mockData = inject(MockDataService);
  private patientSvc = inject(PatientService);
  private route = inject(ActivatedRoute);

  ordonnance = signal<Ordonnance | null>(null);
  patientName = computed(() => {
    const o = this.ordonnance();
    if (!o) return '';
    const p = this.patientSvc.getPatient(+o.patientId);
    return p ? p.fullName : `Patient #${o.patientId}`;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.ordonnance.set(this.mockData.getOrdonnance(id) ?? null);
  }

  typeLabel(t: string): string {
    const m: Record<string, string> = { ORDONNANCE: 'Ordonnance', CERTIFICAT: 'Certificat', BON_EXAMEN: "Bon d'examen", BON_RADIO: 'Bon de radiologie', ARRET_TRAVAIL: 'Arrêt de travail', EVACUATION: 'Évacuation' };
    return m[t] ?? t;
  }
}
