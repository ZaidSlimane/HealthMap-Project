import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { LaboService } from '../services/labo.service';

interface SubAnalysisEntry {
  sub_analysis_id: number;
  name: string;
  unit: string;
  ref_min: number | null;
  ref_max: number | null;
  numeric_value: number | null;
}

interface AnalysisGroup {
  name: string;
  sub_analyses: SubAnalysisEntry[];
}

@Component({
  selector: 'app-labo-request-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hm-page-header
      title="Détail de la demande biologique"
      subtitle="Saisie des résultats"
      icon="science">
      <button class="btn-back" (click)="goBack()">
        <span class="material-icons">arrow_back</span>
        Retour au worklist
      </button>
    </hm-page-header>

    @if (loading()) {
      <hm-spinner label="Chargement de la demande..." />
    } @else if (errorMessage()) {
      <div class="error-banner">
        <span class="material-icons">error</span>
        {{ errorMessage() }}
      </div>
    } @else {
      <div class="detail-grid">
        <!-- Patient Info -->
        <div class="info-cards">
          <div class="info-card card-blue">
            <span class="material-icons">person</span>
            <div>
              <div class="info-label">Patient</div>
              <div class="info-value">{{ request()?.patient?.nom }} {{ request()?.patient?.prenom }}</div>
            </div>
          </div>
          <div class="info-card card-green">
            <span class="material-icons">science</span>
            <div>
              <div class="info-label">Analyses demandées</div>
              <div class="info-value">{{ getItemCount() }} élément(s)</div>
            </div>
          </div>
          <div class="info-card card-orange">
            <span class="material-icons">priority_high</span>
            <div>
              <div class="info-label">Urgence</div>
              <div class="info-value">{{ request()?.urgency === 'urgente' ? 'Urgente' : 'Normale' }}</div>
            </div>
          </div>
        </div>

        <!-- Result Entry Form -->
        <div class="form-section">
          <h3 class="section-title">Saisie des résultats</h3>

          @for (group of analysisGroups(); track group.name) {
            <div class="analysis-group">
              <h4 class="group-title">{{ group.name }}</h4>
              <div class="sub-analyses-table">
                @for (sub of group.sub_analyses; track sub.sub_analysis_id) {
                  <div class="sub-analysis-row">
                    <div class="sub-name">{{ sub.name }}</div>
                    <div class="sub-input">
                      <input
                        type="number"
                        class="numeric-input"
                        [placeholder]="getRefPlaceholder(sub)"
                        [(ngModel)]="sub.numeric_value"
                        step="any" />
                      <span class="unit-label">{{ sub.unit || '' }}</span>
                    </div>
                    @if (sub.ref_min !== null || sub.ref_max !== null) {
                      <div class="ref-range">
                        Réf: {{ sub.ref_min ?? '—' }} - {{ sub.ref_max ?? '—' }}
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          @if (submitError()) {
            <div class="error-banner">
              <span class="material-icons">error</span>
              {{ submitError() }}
            </div>
          }

          <button
            class="btn-submit"
            [disabled]="submitting()"
            (click)="onSubmit()">
            @if (submitting()) {
              <hm-spinner [size]="16" [inline]="true" />
            }
            <span class="material-icons">save</span>
            Enregistrer les résultats
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: var(--radius-sm, 6px);
      border: 1px solid var(--color-border, #e2e8f0);
      background: var(--color-surface, #fff);
      color: var(--color-text, #0f172a);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-back:hover {
      background: var(--color-surface-alt, #f8fafc);
    }

    .btn-back .material-icons {
      font-size: 16px;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      border-radius: var(--radius-md, 10px);
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      font-size: 14px;
    }

    .error-banner .material-icons {
      font-size: 20px;
    }

    .detail-grid {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .info-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .info-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--color-border, #e2e8f0);
    }

    .info-card .material-icons {
      font-size: 28px;
      padding: 8px;
      border-radius: 8px;
    }

    .card-blue {
      background: #eff6ff;
    }
    .card-blue .material-icons {
      color: #2563eb;
      background: rgba(37, 99, 235, 0.1);
    }

    .card-green {
      background: #f0fdf4;
    }
    .card-green .material-icons {
      color: #16a34a;
      background: rgba(22, 163, 106, 0.1);
    }

    .card-orange {
      background: #fffbeb;
    }
    .card-orange .material-icons {
      color: #d97706;
      background: rgba(217, 119, 6, 0.1);
    }

    .info-label {
      font-size: 12px;
      color: var(--color-text-muted, #64748b);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-value {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
      margin-top: 2px;
    }

    .form-section {
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      padding: 20px;
    }

    .section-title {
      margin: 0 0 16px;
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
    }

    .analysis-group {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--color-border, #e2e8f0);
    }

    .analysis-group:last-of-type {
      border-bottom: none;
      margin-bottom: 16px;
    }

    .group-title {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-primary, #00BCD4);
    }

    .sub-analyses-table {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .sub-analysis-row {
      display: grid;
      grid-template-columns: 1fr 200px auto;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      background: var(--color-surface-alt, #f8fafc);
      border-radius: var(--radius-sm, 6px);
    }

    .sub-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text, #0f172a);
    }

    .sub-input {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .numeric-input {
      width: 120px;
      padding: 6px 10px;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-sm, 6px);
      font-size: 13px;
      text-align: right;
      transition: border-color 0.2s ease;
    }

    .numeric-input:focus {
      outline: none;
      border-color: var(--color-primary, #00BCD4);
    }

    .unit-label {
      font-size: 12px;
      color: var(--color-text-muted, #64748b);
      min-width: 40px;
    }

    .ref-range {
      font-size: 11px;
      color: var(--color-text-muted, #64748b);
      white-space: nowrap;
    }

    .btn-submit {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: var(--radius-md, 10px);
      background: var(--color-primary, #00BCD4);
      color: #fff;
      border: none;
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

    .btn-submit .material-icons {
      font-size: 18px;
    }
  `]
})
export class LaboRequestDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly laboService = inject(LaboService);

  readonly request = signal<any>(null);
  readonly analysisGroups = signal<AnalysisGroup[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly submitError = signal('');
  readonly submitting = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadRequest(id);
  }

  goBack(): void {
    this.router.navigate(['/laboratory']);
  }

  getItemCount(): number {
    return this.request()?.items?.length || 0;
  }

  getRefPlaceholder(sub: SubAnalysisEntry): string {
    if (sub.ref_min !== null && sub.ref_max !== null) {
      return `${sub.ref_min} - ${sub.ref_max}`;
    }
    return 'Valeur';
  }

  onSubmit(): void {
    const groups = this.analysisGroups();
    const results: { sub_analysis_id: number; numeric_value: number }[] = [];

    for (const group of groups) {
      for (const sub of group.sub_analyses) {
        if (sub.numeric_value !== null && sub.numeric_value !== undefined) {
          results.push({
            sub_analysis_id: sub.sub_analysis_id,
            numeric_value: sub.numeric_value
          });
        }
      }
    }

    if (results.length === 0) {
      this.submitError.set('Veuillez saisir au moins un résultat.');
      return;
    }

    this.submitError.set('');
    this.submitting.set(true);

    const id = this.request()?.id;
    this.laboService.enterResults(id, results).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/laboratory']);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err.error?.message || 'Erreur lors de la soumission des résultats.';
        this.submitError.set(msg);
      }
    });
  }

  private loadRequest(id: number): void {
    this.loading.set(true);
    this.laboService.getRequestDetail(id).subscribe({
      next: (response: any) => {
        const data = response.data || response;
        this.request.set(data);
        this.buildAnalysisGroups(data);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erreur lors du chargement de la demande.');
        this.loading.set(false);
      }
    });
  }

  private buildAnalysisGroups(data: any): void {
    const groups: AnalysisGroup[] = [];

    if (data?.items) {
      for (const item of data.items) {
        const analyse = item.analyse || item.labo_analyse;
        if (analyse) {
          const subAnalyses = (analyse.sub_analyses || analyse.labo_s_analyses || []).map((sa: any) => ({
            sub_analysis_id: sa.id,
            name: sa.name || sa.designation,
            unit: sa.unit || sa.unite || '',
            ref_min: sa.ref_min ?? sa.valeur_min ?? null,
            ref_max: sa.ref_max ?? sa.valeur_max ?? null,
            numeric_value: null
          }));
          groups.push({ name: analyse.name || analyse.designation, sub_analyses: subAnalyses });
        }

        // If it's a panel (billon), it may contain multiple analyses
        const billon = item.billon || item.labo_billon;
        if (billon && billon.analyses) {
          for (const an of billon.analyses) {
            const subAnalyses = (an.sub_analyses || an.labo_s_analyses || []).map((sa: any) => ({
              sub_analysis_id: sa.id,
              name: sa.name || sa.designation,
              unit: sa.unit || sa.unite || '',
              ref_min: sa.ref_min ?? sa.valeur_min ?? null,
              ref_max: sa.ref_max ?? sa.valeur_max ?? null,
              numeric_value: null
            }));
            groups.push({ name: an.name || an.designation, sub_analyses: subAnalyses });
          }
        }
      }
    }

    this.analysisGroups.set(groups);
  }
}
