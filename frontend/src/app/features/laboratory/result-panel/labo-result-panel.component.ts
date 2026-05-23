import { Component, ChangeDetectionStrategy, inject, signal, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { LaboService } from '../services/labo.service';

interface ResultGroup {
  analyseName: string;
  subResults: {
    name: string;
    numeric_value: number | null;
    text_value: string | null;
    unit: string;
    ref_min: number | null;
    ref_max: number | null;
    is_abnormal: boolean;
  }[];
}

@Component({
  selector: 'app-labo-result-panel',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <hm-spinner [size]="24" [inline]="true" label="Chargement..." />
    } @else if (resultGroups().length === 0) {
      <div class="empty-state">
        <span class="material-icons">science</span>
        <p>Aucun résultat biologique disponible</p>
      </div>
    } @else {
      <div class="results-list">
        @for (group of resultGroups(); track group.analyseName) {
          <div class="result-group">
            <div class="group-header">
              <span class="group-name">{{ group.analyseName }}</span>
            </div>
            <div class="sub-results">
              @for (sub of group.subResults; track sub.name) {
                <div class="sub-result-row" [class.abnormal]="sub.is_abnormal">
                  <span class="sub-name">{{ sub.name }}</span>
                  <span class="sub-value" [class.value-abnormal]="sub.is_abnormal">
                    {{ sub.numeric_value !== null ? sub.numeric_value : '—' }}
                    <span class="sub-unit">{{ sub.unit }}</span>
                  </span>
                  @if (sub.ref_min !== null || sub.ref_max !== null) {
                    <span class="sub-ref">
                      ({{ sub.ref_min ?? '—' }} - {{ sub.ref_max ?? '—' }})
                    </span>
                  }
                  @if (sub.is_abnormal) {
                    <span class="abnormal-badge">Anormal</span>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 24px 16px;
      color: var(--color-text-muted, #64748b);
    }

    .empty-state .material-icons {
      font-size: 32px;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
      font-size: 13px;
    }

    .results-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .result-group {
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-sm, 6px);
      overflow: hidden;
    }

    .group-header {
      padding: 10px 12px;
      background: var(--color-surface-alt, #f8fafc);
      border-bottom: 1px solid var(--color-border, #e2e8f0);
    }

    .group-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-primary, #00BCD4);
    }

    .sub-results {
      padding: 8px 12px;
    }

    .sub-result-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
      border-bottom: 1px solid var(--color-border, #e2e8f0);
    }

    .sub-result-row:last-child {
      border-bottom: none;
    }

    .sub-result-row.abnormal {
      background: #fef2f2;
      margin: 0 -12px;
      padding: 6px 12px;
      border-radius: 4px;
    }

    .sub-name {
      flex: 1;
      font-size: 12px;
      color: var(--color-text, #0f172a);
    }

    .sub-value {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
    }

    .value-abnormal {
      color: #dc2626;
    }

    .sub-unit {
      font-size: 11px;
      font-weight: 400;
      color: var(--color-text-muted, #64748b);
      margin-left: 2px;
    }

    .sub-ref {
      font-size: 11px;
      color: var(--color-text-muted, #64748b);
    }

    .abnormal-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 600;
      background: #fecaca;
      color: #dc2626;
    }
  `]
})
export class LaboResultPanelComponent implements OnInit, OnChanges {
  @Input() consultationId!: number;

  private readonly laboService = inject(LaboService);

  readonly resultGroups = signal<ResultGroup[]>([]);
  readonly loading = signal(false);

  ngOnInit(): void {
    if (this.consultationId) {
      this.loadResults();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['consultationId'] && !changes['consultationId'].firstChange) {
      this.loadResults();
    }
  }

  private loadResults(): void {
    this.loading.set(true);
    this.laboService.getRequestsForConsultation(this.consultationId).subscribe({
      next: (data) => {
        const items = Array.isArray(data) ? data : (data as any).data || [];
        const groups = this.buildResultGroups(items);
        this.resultGroups.set(groups);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private buildResultGroups(requests: any[]): ResultGroup[] {
    const groups: ResultGroup[] = [];

    for (const req of requests) {
      if (req.status !== 'completed') continue;

      const results = req.results || req.labo_results || [];
      // Group results by their parent analyse
      const analyseMap = new Map<string, ResultGroup>();

      for (const result of results) {
        const subAnalyse = result.sub_analyse || result.labo_s_analyse;
        const analyse = subAnalyse?.analyse || subAnalyse?.labo_analyse;
        const analyseName = analyse?.name || analyse?.designation || 'Analyse';

        if (!analyseMap.has(analyseName)) {
          analyseMap.set(analyseName, { analyseName, subResults: [] });
        }

        const refMin = subAnalyse?.ref_min ?? subAnalyse?.valeur_min ?? null;
        const refMax = subAnalyse?.ref_max ?? subAnalyse?.valeur_max ?? null;
        const numericValue = result.numeric_value;
        const isAbnormal = this.checkAbnormal(numericValue, refMin, refMax);

        analyseMap.get(analyseName)!.subResults.push({
          name: subAnalyse?.name || subAnalyse?.designation || '',
          numeric_value: numericValue,
          text_value: result.text_value || null,
          unit: subAnalyse?.unit || subAnalyse?.unite || '',
          ref_min: refMin,
          ref_max: refMax,
          is_abnormal: isAbnormal
        });
      }

      groups.push(...analyseMap.values());
    }

    return groups;
  }

  private checkAbnormal(value: number | null, min: number | null, max: number | null): boolean {
    if (value === null || value === undefined) return false;
    if (min !== null && value < min) return true;
    if (max !== null && value > max) return true;
    return false;
  }
}
