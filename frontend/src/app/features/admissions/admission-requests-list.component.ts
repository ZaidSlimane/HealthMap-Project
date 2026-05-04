import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdmissionRequestService } from '../../core/services/admission-request.service';

@Component({
  selector: 'hm-admission-requests-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="arl-page">
      <header class="arl-head">
        <div class="title-wrap">
          <span class="material-icons head-icon">assignment_ind</span>
          <div>
            <h1>Liste des demandes d'admission</h1>
            <p class="sub">{{ pending().length }} demande(s) en attente
              @if (showArchived()) { · {{ archived().length }} archivée(s) }
            </p>
          </div>
        </div>
        <div class="actions">
          <button type="button" class="archive-toggle"
            [class.active]="showArchived()"
            (click)="toggleArchived()">
            <span class="material-icons">{{ showArchived() ? 'visibility_off' : 'archive' }}</span>
            {{ showArchived() ? 'Masquer archives' : 'Archive' }}
          </button>
        </div>
      </header>

      <div class="arl-card">
        <table class="arl-table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Nom Prenom</th>
              <th>Médecin</th>
              <th>Service</th>
              <th>Garde Malade</th>
              <th>Décharge</th>
              <th class="action-col">Action</th>
            </tr>
          </thead>
          <tbody>
            @if (pending().length === 0) {
              <tr><td colspan="7" class="empty-row">
                <span class="material-icons">inbox</span>
                Aucune demande d'admission en attente
              </td></tr>
            } @else {
              @for (r of pending(); track r.id; let i = $index) {
                <tr class="data-row">
                  <td>{{ i + 1 }}</td>
                  <td><span class="material-icons name-ic">person</span> {{ r.nom }} {{ r.prenom }}</td>
                  <td>{{ r.medecin }}</td>
                  <td><a class="svc-link">{{ r.serviceNom }}</a></td>
                  <td>{{ r.gardeMalade ? 'Oui' : 'Non' }}</td>
                  <td>{{ r.decharge ? 'Oui' : 'Non' }}</td>
                  <td class="action-col">
                    <button type="button" class="link-btn validate" (click)="validate(r.id)">
                      valider l'admission
                    </button>
                    <span class="sep">|</span>
                    <button type="button" class="link-btn delete" (click)="remove(r.id)">
                      Supprime
                    </button>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      @if (showArchived() && archived().length > 0) {
        <div class="arl-card archive-card">
          <div class="archive-head">
            <span class="material-icons">inventory_2</span>
            <h2>Demandes archivées / validées</h2>
          </div>
          <table class="arl-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Nom Prenom</th>
                <th>Service</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              @for (r of archived(); track r.id; let i = $index) {
                <tr class="data-row archived">
                  <td>{{ i + 1 }}</td>
                  <td>{{ r.nom }} {{ r.prenom }}</td>
                  <td>{{ r.serviceNom }}</td>
                  <td>
                    <span class="status-pill" [class.validated]="r.status === 'VALIDATED'">
                      {{ r.status === 'VALIDATED' ? 'Validée' : 'Archivée' }}
                    </span>
                  </td>
                  <td>{{ r.createdAt | date:'short' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-body, 'Plus Jakarta Sans', sans-serif); }
    .arl-page { padding: 24px 28px; max-width: 1400px; margin: 0 auto; }

    .arl-head {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 18px;
      margin-bottom: 18px;
    }
    .title-wrap { display: flex; align-items: center; gap: 12px; }
    .head-icon { color: var(--color-primary, #00BCD4); font-size: 30px; }
    .arl-head h1 { margin: 0; font-size: 22px; font-weight: 700; color: #0f172a;
      font-family: var(--font-heading, 'Plus Jakarta Sans', sans-serif); }
    .sub { margin: 2px 0 0; color: #64748b; font-size: 13px; }

    .archive-toggle {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--color-success, #43A047); color: #fff;
      border: 0; padding: 9px 16px; border-radius: var(--radius-md, 10px);
      font-weight: 700; font-size: 13px; cursor: pointer; transition: background .15s;
      font-family: inherit; box-shadow: 0 2px 6px rgba(67,160,71,.25);
    }
    .archive-toggle:hover { background: #2E7D32; }
    .archive-toggle.active { background: #475569; }
    .archive-toggle .material-icons { font-size: 18px; }

    .arl-card {
      background: #fff; border-radius: var(--radius-lg, 14px);
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      overflow: hidden; margin-bottom: 18px;
    }

    .arl-table { width: 100%; border-collapse: collapse; }
    .arl-table thead th {
      text-align: left; padding: 14px 16px; font-size: 12.5px; font-weight: 700;
      color: #334155; background: #f8fafc;
      border-bottom: 1px solid var(--color-border, rgba(0,0,0,0.08));
    }
    .arl-table tbody td {
      padding: 14px 16px; font-size: 13.5px; color: #1e293b;
      border-bottom: 1px solid #f1f5f9;
    }
    .data-row:hover { background: #f8fafc; }
    .data-row.archived { color: #64748b; }
    .name-ic { font-size: 16px; color: var(--color-primary-dark, #0097A7); vertical-align: middle; margin-right: 4px; }
    .svc-link { color: var(--color-primary-dark, #0097A7); font-weight: 600; cursor: pointer; }

    .action-col { white-space: nowrap; }
    .link-btn {
      background: transparent; border: 0; cursor: pointer; padding: 0;
      font-size: 13px; font-weight: 600; font-family: inherit;
    }
    .link-btn.validate { color: var(--color-primary-dark, #0097A7); }
    .link-btn.validate:hover { text-decoration: underline; }
    .link-btn.delete { color: var(--color-urgent, #E53935); }
    .link-btn.delete:hover { text-decoration: underline; }
    .sep { color: #cbd5e1; margin: 0 8px; }

    .empty-row {
      text-align: center; padding: 40px 16px; color: #94a3b8; font-style: italic;
    }
    .empty-row .material-icons { display: block; margin: 0 auto 8px; font-size: 36px; color: #cbd5e1; }

    .archive-head {
      display: flex; align-items: center; gap: 10px; padding: 14px 16px;
      background: #f1f5f9; border-bottom: 1px solid var(--color-border, rgba(0,0,0,0.08));
    }
    .archive-head .material-icons { color: #475569; }
    .archive-head h2 { margin: 0; font-size: 14px; font-weight: 700; color: #334155; }

    .status-pill {
      display: inline-block; padding: 2px 10px; border-radius: 999px;
      font-size: 11.5px; font-weight: 700; background: #e2e8f0; color: #475569;
    }
    .status-pill.validated { background: var(--color-success-bg, #f0faf0); color: var(--color-success, #43A047); }
  `]
})
export class AdmissionRequestsListComponent {
  private svc = inject(AdmissionRequestService);

  pending = this.svc.pending;
  archived = this.svc.archived;

  showArchived = signal(false);

  toggleArchived(): void { this.showArchived.update(v => !v); }

  validate(id: string): void {
    // validate() now POSTs to /clinical-core/admissions; subscribe so the
    // request is actually fired. Errors are surfaced via the request's
    // lastError field (rendered later by the row, TBD).
    this.svc.validate(id).subscribe({
      next: () => { /* state mutation handled inside the service */ },
      error: () => { /* lastError already set on the request */ },
    });
  }
  remove(id: string): void {
    if (!confirm('Supprimer cette demande d\'admission ?')) return;
    this.svc.remove(id);
  }
}
