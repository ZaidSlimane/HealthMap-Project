import { Component, ChangeDetectionStrategy, inject, signal, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { RadioService } from '../services/radio.service';

@Component({
  selector: 'app-radio-result-panel',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <hm-spinner [size]="24" [inline]="true" label="Chargement..." />
    } @else if (results().length === 0) {
      <div class="empty-state">
        <span class="material-icons">image_not_supported</span>
        <p>Aucun résultat radiologique disponible</p>
      </div>
    } @else {
      <div class="results-list">
        @for (item of results(); track item.id) {
          <div class="result-item">
            <div class="result-header">
              <span class="result-exam">{{ getExamLabel(item) }}</span>
              <span class="badge" [class.badge-completed]="item.status === 'completed'" [class.badge-pending]="item.status === 'pending' || item.status === 'in_progress'">
                {{ getStatusLabel(item.status) }}
              </span>
            </div>
            @if (item.resultat || item.result) {
              <div class="result-body">
                @if (getCompteRendu(item)) {
                  <p class="compte-rendu">{{ getCompteRendu(item) }}</p>
                }
                <div class="result-meta">
                  <span class="meta-item">
                    <span class="material-icons">person</span>
                    {{ getPerformedBy(item) }}
                  </span>
                  <span class="meta-item">
                    <span class="material-icons">calendar_today</span>
                    {{ getCompletedDate(item) | date:'dd/MM/yyyy' }}
                  </span>
                </div>
                @if (hasFile(item)) {
                  <button class="btn-download" (click)="onDownload(item)">
                    <span class="material-icons">download</span>
                    Télécharger le fichier
                  </button>
                }
              </div>
            }
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

    .result-item {
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-sm, 6px);
      padding: 12px;
    }

    .result-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .result-exam {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
    }

    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    }

    .badge-completed {
      background: #dcfce7;
      color: #16a34a;
    }

    .badge-pending {
      background: #fffbeb;
      color: #d97706;
    }

    .result-body {
      border-top: 1px solid var(--color-border, #e2e8f0);
      padding-top: 8px;
    }

    .compte-rendu {
      margin: 0 0 8px;
      font-size: 13px;
      color: var(--color-text-muted, #64748b);
      line-height: 1.4;
    }

    .result-meta {
      display: flex;
      gap: 16px;
      margin-bottom: 8px;
    }

    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--color-text-muted, #64748b);
    }

    .meta-item .material-icons {
      font-size: 14px;
    }

    .btn-download {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: var(--radius-sm, 6px);
      border: 1px solid var(--color-primary, #00BCD4);
      background: rgba(0, 188, 212, 0.08);
      color: var(--color-primary, #00BCD4);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-download:hover {
      background: var(--color-primary, #00BCD4);
      color: #fff;
    }

    .btn-download .material-icons {
      font-size: 14px;
    }
  `]
})
export class RadioResultPanelComponent implements OnInit, OnChanges {
  @Input() consultationId!: number;

  private readonly radioService = inject(RadioService);

  readonly results = signal<any[]>([]);
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

  getExamLabel(item: any): string {
    if (item.items && item.items.length > 0) {
      return item.items.map((i: any) => i.exam_type?.name || i.radiology_exam_type?.name || '').filter(Boolean).join(', ');
    }
    return 'Examen radiologique';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'En attente';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminé';
      default: return status;
    }
  }

  getCompteRendu(item: any): string {
    return item.resultat?.compte_rendu || item.result?.compte_rendu || '';
  }

  getPerformedBy(item: any): string {
    const performer = item.resultat?.performed_by_user || item.result?.performed_by_user;
    return performer?.name || 'Technicien';
  }

  getCompletedDate(item: any): string {
    return item.resultat?.created_at || item.result?.created_at || item.updated_at;
  }

  hasFile(item: any): boolean {
    return !!(item.resultat?.file_path || item.result?.file_path);
  }

  onDownload(item: any): void {
    const resultId = item.resultat?.id || item.result?.id;
    if (!resultId) return;

    this.radioService.downloadResult(resultId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resultat-radio-${resultId}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  private loadResults(): void {
    this.loading.set(true);
    this.radioService.getRequestsForConsultation(this.consultationId).subscribe({
      next: (data) => {
        const items = Array.isArray(data) ? data : (data as any).data || [];
        this.results.set(items.filter((r: any) => r.status === 'completed' || r.status === 'in_progress' || r.status === 'pending'));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
