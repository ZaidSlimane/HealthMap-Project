import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MockDataService } from '../../../core/services/mock-data.service';
import { PatientService } from '../../../core/services/patient.service';
import { StatutAvis } from '../../../core/models/avis.model';

@Component({
  selector: 'app-avis-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Avis Externes & Inter-services</h1>
          <p class="page-sub">Demandes de consultations spécialisées</p>
        </div>
        <button class="btn-teal" routerLink="nouveau"><mat-icon>add</mat-icon> Nouvelle demande d'avis</button>
      </div>

      <div class="tabs-row">
        @for (tab of tabs; track tab.id) {
          <button class="tab-btn" [class.active]="activeTab() === tab.id" (click)="activeTab.set(tab.id)">
            {{ tab.label }} <span class="tab-count">{{ tabCount(tab.id) }}</span>
          </button>
        }
      </div>

      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th>Spécialité</th>
              <th>Demandeur</th>
              <th>Établissement</th>
              <th>Urgence</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (a of filteredAvis(); track a.id) {
              <tr>
                <td>{{ a.datedemande | date:'dd/MM/yyyy' }}</td>
                <td class="td-patient">{{ getPatientName(a.patientId) }}</td>
                <td>{{ a.specialite }}</td>
                <td>{{ a.medecinDemandeur }}</td>
                <td>{{ a.etablissement || 'Inter-service' }}</td>
                <td>
                  @if (a.urgence) {
                    <span class="urgence-tag">Urgent</span>
                  } @else {
                    <span class="na">—</span>
                  }
                </td>
                <td><span class="statut-badge" [class]="'s-' + a.statut.toLowerCase()">{{ statutLabel(a.statut) }}</span></td>
                <td><button class="action-btn" [routerLink]="['/avis-externes', a.id]"><mat-icon>visibility</mat-icon></button></td>
              </tr>
            }
            @empty {
              <tr><td colspan="8" class="empty-row">Aucune demande d'avis</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: var(--space-6); }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5); }
    .page-title { font-size: 22px; font-weight: 700; margin: 0; }
    .page-sub { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; }
    .tabs-row { display: flex; gap: 0; margin-bottom: var(--space-5); border-bottom: 1px solid var(--color-border); }
    .tab-btn { padding: var(--space-3) var(--space-5); border: none; background: transparent; font-size: 13px; font-weight: 500; color: var(--color-text-muted); cursor: pointer; border-bottom: 2px solid transparent; display: flex; align-items: center; gap: var(--space-2); &.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 700; } }
    .tab-count { background: var(--color-background); border-radius: var(--radius-full); padding: 1px 6px; font-size: 11px; font-weight: 700; }
    .table-card { background: var(--color-surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; th { padding: var(--space-3) var(--space-4); text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); background: var(--color-background); border-bottom: 1px solid var(--color-border); } td { padding: var(--space-3) var(--space-4); font-size: 13px; border-bottom: 1px solid var(--color-border); } tr:last-child td { border-bottom: none; } }
    .td-patient { font-weight: 600; }
    .urgence-tag { background: rgba(229,57,53,0.1); color: #C62828; border-radius: var(--radius-full); padding: 2px 8px; font-size: 11px; font-weight: 700; }
    .na { color: var(--color-text-muted); }
    .statut-badge { padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700; &.s-demande { background: rgba(33,150,243,0.1); color: #1565C0; } &.s-en_attente { background: rgba(255,152,0,0.1); color: #E65100; } &.s-repondu { background: rgba(76,175,80,0.1); color: #2E7D32; } &.s-annule { background: rgba(158,158,158,0.1); color: #616161; } }
    .action-btn { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 4px; cursor: pointer; color: var(--color-text-muted); display: flex; mat-icon { font-size: 16px; } &:hover { color: var(--color-primary); } }
    .empty-row { text-align: center; color: var(--color-text-muted); padding: var(--space-8) !important; }
    .btn-teal { display: inline-flex; align-items: center; gap: var(--space-2); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 13px; font-weight: 600; cursor: pointer; mat-icon { font-size: 18px; } }
  `]
})
export class AvisListComponent {
  private mockData = inject(MockDataService);
  private patientSvc = inject(PatientService);

  activeTab = signal<string>('tous');
  tabs = [
    { id: 'tous', label: 'Tous' },
    { id: 'envoyes', label: 'Demandes envoyées' },
    { id: 'externes', label: 'Externes (autre établissement)' },
  ];

  filteredAvis = computed(() => {
    const all = this.mockData.getAvis();
    if (this.activeTab() === 'envoyes') return all.filter(a => !a.externe);
    if (this.activeTab() === 'externes') return all.filter(a => a.externe);
    return all;
  });

  tabCount(id: string): number {
    const all = this.mockData.getAvis();
    if (id === 'envoyes') return all.filter(a => !a.externe).length;
    if (id === 'externes') return all.filter(a => a.externe).length;
    return all.length;
  }

  getPatientName(id: string): string {
    const p = this.patientSvc.getPatient(+id);
    return p ? p.fullName : `Patient #${id}`;
  }

  statutLabel(s: StatutAvis): string {
    const m: Record<StatutAvis, string> = { DEMANDE: 'Demandé', EN_ATTENTE: 'En attente', REPONDU: 'Répondu', ANNULE: 'Annulé' };
    return m[s];
  }
}
