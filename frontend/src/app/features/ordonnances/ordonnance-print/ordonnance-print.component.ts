import { Component, signal, inject, ChangeDetectionStrategy, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MockDataService } from '../../../core/services/mock-data.service';
import { PatientService } from '../../../core/services/patient.service';
import { Ordonnance } from '../../../core/models/ordonnance.model';

@Component({
  selector: 'app-ordonnance-print',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="print-actions no-print">
      <button class="btn-back" routerLink="/ordonnances"><mat-icon>arrow_back</mat-icon> Retour</button>
      <button class="btn-print" (click)="print()"><mat-icon>print</mat-icon> Imprimer</button>
    </div>

    @if (ordonnance()) {
      <div class="print-content">
        <div class="print-header">
          <div class="ph-hospital">
            <strong>ÉTABLISSEMENT PUBLIC HOSPITALIER</strong>
            <p>Service de Médecine — HealthMap System</p>
            <p>Rue de la République, Alger · Tél: 021 XX XX XX</p>
          </div>
          <div class="ph-logo">HM</div>
        </div>

        <div class="print-doc-title">{{ typeLabel(ordonnance()!.type) }}</div>
        <div class="print-ref">N° {{ ordonnance()!.id }} · Date: {{ ordonnance()!.date | date:'dd/MM/yyyy' }}</div>

        <div class="print-patient">
          <div class="pp-row"><span class="pp-label">Patient :</span> <strong>{{ patientName() }}</strong></div>
          <div class="pp-row"><span class="pp-label">N° dossier :</span> {{ ordonnance()!.patientId }}</div>
          <div class="pp-row"><span class="pp-label">Prescripteur :</span> {{ ordonnance()!.medecin }}</div>
        </div>

        @if (ordonnance()!.medicaments.length > 0) {
          <div class="print-meds">
            @for (m of ordonnance()!.medicaments; track m.nom; let i = $index) {
              <div class="pm-item">
                <div class="pm-num">{{ i + 1 }}</div>
                <div class="pm-body">
                  <strong>{{ m.nom }} {{ m.dosage }}</strong> — {{ m.forme }}
                  <br />{{ m.frequence }} pendant {{ m.duree }} — Quantité: {{ m.quantite }}
                  @if (m.instructions) { <br /><em>{{ m.instructions }}</em> }
                </div>
              </div>
            }
          </div>
        }

        @if (ordonnance()!.notes) {
          <div class="print-notes"><strong>Notes :</strong> {{ ordonnance()!.notes }}</div>
        }

        <div class="print-signature">
          <div class="sig-block">
            <p class="sig-name">{{ ordonnance()!.medecin }}</p>
            <p class="sig-title">Médecin traitant</p>
            <div class="sig-box">Cachet et signature</div>
          </div>
        </div>

        <div class="print-footer">
          Ordonnance valable 3 mois à compter du {{ ordonnance()!.date | date:'dd/MM/yyyy' }}
        </div>
      </div>
    }
  `,
  styles: [`
    .print-actions { display: flex; gap: var(--space-3); padding: var(--space-4); border-bottom: 1px solid var(--color-border); }
    .btn-back { display: inline-flex; align-items: center; gap: var(--space-2); background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 8px var(--space-4); font-size: 13px; cursor: pointer; mat-icon { font-size: 16px; } }
    .btn-print { display: inline-flex; align-items: center; gap: var(--space-2); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); padding: 8px var(--space-4); font-size: 13px; font-weight: 600; cursor: pointer; mat-icon { font-size: 16px; } }
    .print-content { max-width: 680px; margin: var(--space-6) auto; padding: 20mm; background: #fff; font-family: Georgia, serif; color: #000; box-shadow: var(--shadow-lg); }
    .print-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: var(--space-4); border-bottom: 2px solid #000; margin-bottom: var(--space-4); }
    .ph-hospital { strong { font-size: 14pt; } p { font-size: 10pt; margin: 4px 0 0; color: #333; } }
    .ph-logo { width: 60px; height: 60px; background: #00BCD4; color: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; }
    .print-doc-title { font-size: 18pt; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 0.1em; margin: var(--space-5) 0 var(--space-2); border-top: 1px solid #ccc; padding-top: var(--space-4); }
    .print-ref { text-align: center; font-size: 10pt; color: #666; margin-bottom: var(--space-5); }
    .print-patient { border: 1px solid #ccc; border-radius: 4px; padding: var(--space-3) var(--space-4); margin-bottom: var(--space-5); }
    .pp-row { font-size: 11pt; padding: 3px 0; .pp-label { color: #555; margin-right: 8px; } }
    .print-meds { margin-bottom: var(--space-5); }
    .pm-item { display: flex; gap: var(--space-3); margin-bottom: var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px dashed #ccc; }
    .pm-num { font-weight: 700; font-size: 14pt; color: #00BCD4; min-width: 24px; }
    .pm-body { font-size: 11pt; line-height: 1.8; strong { font-size: 12pt; } em { color: #555; font-size: 10pt; } }
    .print-notes { font-size: 10pt; color: #555; margin-bottom: var(--space-5); padding: var(--space-3); background: #f9f9f9; border-left: 3px solid #00BCD4; }
    .print-signature { display: flex; justify-content: flex-end; margin-top: var(--space-8); }
    .sig-block { text-align: center; }
    .sig-name { font-weight: 700; font-size: 12pt; margin: 0; }
    .sig-title { font-size: 10pt; color: #555; margin: 4px 0 var(--space-3); }
    .sig-box { width: 140px; height: 70px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 9pt; color: #999; margin: 0 auto; }
    .print-footer { font-size: 9pt; color: #777; text-align: center; border-top: 1px solid #ccc; padding-top: var(--space-3); margin-top: var(--space-6); }
    @media print {
      .no-print { display: none !important; }
      app-shell, app-sidebar, app-header { display: none !important; }
      .print-content { box-shadow: none; margin: 0; }
    }
  `]
})
export class OrdonnancePrintComponent implements OnInit, AfterViewInit {
  private mockData = inject(MockDataService);
  private patientSvc = inject(PatientService);
  private route = inject(ActivatedRoute);

  ordonnance = signal<Ordonnance | null>(null);
  patientName = signal<string>('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    const o = this.mockData.getOrdonnance(id);
    this.ordonnance.set(o ?? null);
    if (o) {
      const p = this.patientSvc.getPatient(+o.patientId);
      this.patientName.set(p ? p.fullName : `Patient #${o.patientId}`);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => window.print(), 500);
  }

  print(): void { window.print(); }

  typeLabel(t: string): string {
    const m: Record<string, string> = { ORDONNANCE: 'Ordonnance médicale', CERTIFICAT: 'Certificat médical', BON_EXAMEN: "Bon d'examen biologique", BON_RADIO: 'Bon de radiologie', ARRET_TRAVAIL: 'Arrêt de travail', EVACUATION: 'Bon d\'évacuation' };
    return m[t] ?? t;
  }
}
