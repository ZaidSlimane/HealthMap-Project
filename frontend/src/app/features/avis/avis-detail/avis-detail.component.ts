import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MockDataService } from '../../../core/services/mock-data.service';
import { PatientService } from '../../../core/services/patient.service';
import { AvisExterne, StatutAvis } from '../../../core/models/avis.model';

@Component({
  selector: 'app-avis-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ad-page">
      @if (avis()) {
        <div class="ad-header">
          <button class="btn-back" routerLink="/avis-externes"><mat-icon>arrow_back</mat-icon></button>
          <div class="ad-title-wrap">
            <h1 class="ad-title">Avis — {{ avis()!.specialite }}</h1>
            <p class="ad-sub">{{ patientName() }} · {{ avis()!.datedemande | date:'dd/MM/yyyy' }}</p>
          </div>
          <span class="statut-badge" [class]="'s-' + avis()!.statut.toLowerCase()">{{ statutLabel(avis()!.statut) }}</span>
        </div>

        <div class="ad-grid">
          <div class="ad-card">
            <h3 class="adc-title">Détails de la demande</h3>
            <div class="ad-field"><label>Patient</label><p>{{ patientName() }}</p></div>
            <div class="ad-field"><label>Médecin demandeur</label><p>{{ avis()!.medecinDemandeur }}</p></div>
            <div class="ad-field"><label>Spécialité</label><p>{{ avis()!.specialite }}</p></div>
            <div class="ad-field"><label>Type</label><p>{{ avis()!.externe ? 'Externe — ' + avis()!.etablissement : 'Inter-service' }}</p></div>
            @if (avis()!.urgence) {
              <div class="urgence-banner"><mat-icon>emergency</mat-icon> Demande urgente</div>
            }
            <div class="ad-field full-width"><label>Motif</label><p class="motif-text">{{ avis()!.motif }}</p></div>
          </div>

          @if (avis()!.reponse) {
            <div class="ad-card">
              <h3 class="adc-title">Réponse du consultant</h3>
              <div class="ad-field"><label>Médecin consultant</label><p>{{ avis()!.medecinConsultant ?? '—' }}</p></div>
              <div class="ad-field"><label>Date réponse</label><p>{{ avis()!.dateReponse | date:'dd/MM/yyyy' }}</p></div>
              <div class="ad-field full-width"><label>Réponse</label><p class="motif-text">{{ avis()!.reponse }}</p></div>
              @if (avis()!.recommendation) {
                <div class="rec-chip"><mat-icon>recommend</mat-icon> {{ avis()!.recommendation }}</div>
              }
            </div>
          } @else {
            <div class="ad-card">
              <h3 class="adc-title">Répondre à la demande</h3>
              <div class="response-form">
                <label class="rf-label">Réponse et recommandations</label>
                <textarea [(ngModel)]="reponseText" rows="4" class="rf-textarea" placeholder="Rédigez votre réponse clinique..."></textarea>
                <div class="rec-options">
                  @for (r of recOptions; track r) {
                    <button type="button" class="rec-btn" [class.active]="selectedRec() === r" (click)="selectedRec.set(r)">{{ r }}</button>
                  }
                </div>
                <button class="btn-submit" (click)="submitResponse()"><mat-icon>send</mat-icon> Soumettre la réponse</button>
              </div>
            </div>
          }
        </div>
      } @else {
        <p class="not-found">Demande d'avis introuvable</p>
      }
    </div>
  `,
  styles: [`
    .ad-page { padding: var(--space-6); }
    .ad-header { display: flex; align-items: flex-start; gap: var(--space-4); margin-bottom: var(--space-6); }
    .btn-back { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 6px; cursor: pointer; display: flex; }
    .ad-title-wrap { flex: 1; }
    .ad-title { font-size: 20px; font-weight: 700; margin: 0; }
    .ad-sub { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; }
    .statut-badge { padding: 6px 16px; border-radius: var(--radius-full); font-size: 13px; font-weight: 700; &.s-demande { background: rgba(33,150,243,0.1); color: #1565C0; } &.s-en_attente { background: rgba(255,152,0,0.1); color: #E65100; } &.s-repondu { background: rgba(76,175,80,0.1); color: #2E7D32; } &.s-annule { background: rgba(158,158,158,0.1); color: #616161; } }
    .ad-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); }
    .ad-card { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-md); }
    .adc-title { font-size: 14px; font-weight: 700; margin: 0 0 var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-border); color: var(--color-text); }
    .ad-field { margin-bottom: var(--space-3); label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); display: block; margin-bottom: 4px; } p { font-size: 13px; color: var(--color-text); margin: 0; } &.full-width { grid-column: 1 / -1; } }
    .motif-text { line-height: 1.7; font-style: italic; }
    .urgence-banner { background: rgba(229,57,53,0.1); color: #C62828; border-radius: var(--radius-md); padding: var(--space-2) var(--space-3); display: flex; align-items: center; gap: var(--space-2); font-size: 13px; font-weight: 700; margin-bottom: var(--space-3); mat-icon { font-size: 16px; } }
    .rec-chip { display: inline-flex; align-items: center; gap: var(--space-2); background: rgba(76,175,80,0.1); color: #2E7D32; border-radius: var(--radius-full); padding: 4px 12px; font-size: 13px; font-weight: 600; mat-icon { font-size: 14px; } }
    .response-form { display: flex; flex-direction: column; gap: var(--space-3); }
    .rf-label { font-size: 12px; font-weight: 700; color: var(--color-text-muted); }
    .rf-textarea { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-3); font-size: 13px; font-family: var(--font-body); background: var(--color-background); resize: vertical; &:focus { outline: none; border-color: var(--color-primary); } }
    .rec-options { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .rec-btn { padding: 6px 14px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: transparent; font-size: 12px; cursor: pointer; &.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); } }
    .btn-submit { display: inline-flex; align-items: center; gap: var(--space-2); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 13px; font-weight: 600; cursor: pointer; mat-icon { font-size: 16px; } }
    .not-found { color: var(--color-text-muted); padding: var(--space-10); text-align: center; }
  `]
})
export class AvisDetailComponent implements OnInit {
  private mockData = inject(MockDataService);
  private patientSvc = inject(PatientService);
  private route = inject(ActivatedRoute);

  avis = signal<AvisExterne | null>(null);
  patientName = computed(() => {
    const a = this.avis();
    if (!a) return '';
    const p = this.patientSvc.getPatient(+a.patientId);
    return p ? p.fullName : `Patient #${a.patientId}`;
  });
  reponseText = '';
  selectedRec = signal<string>('');
  recOptions = ['Hospitaliser', 'Référer', 'Traitement ambulatoire'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    const avisData = this.mockData.getAvis_(id);
    this.avis.set(avisData ?? null);
  }

  statutLabel(s: StatutAvis): string {
    const m: Record<StatutAvis, string> = { DEMANDE: 'Demandé', EN_ATTENTE: 'En attente', REPONDU: 'Répondu', ANNULE: 'Annulé' };
    return m[s];
  }

  submitResponse(): void {}
}
