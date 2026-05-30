import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { ChefApiService, ForecastDay } from '../chef.service';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend, annotationPlugin);

@Component({
  selector: 'app-bed-forecast',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="forecast-card">
      <div class="forecast-header">
        <div>
          <p class="eyebrow">Prévision des lits</p>
          <h4>Projection sur {{ window() }} jours</h4>
          <p class="forecast-copy">
            La courbe affiche la tendance d'occupation du service et met en avant le seuil critique.
          </p>
        </div>

        <div class="forecast-status" [class.forecast-status--error]="error()" [class.forecast-status--live]="!error() && !loading()">
          <span class="forecast-status__dot"></span>
          @if (loading()) {
            Chargement
          } @else if (error()) {
            Données indisponibles
          } @else {
            Données actualisées
          }
        </div>
      </div>

      <div class="forecast-summary">
        <div class="summary-tile summary-tile--accent">
          <span>Occupation aujourd'hui</span>
          <strong>
            @if (loading() || error()) {
              --
            } @else {
              {{ todayOccupancy() !== null ? todayOccupancy() + '%' : '--' }}
            }
          </strong>
        </div>
        <div class="summary-tile">
          <span>Seuil critique</span>
          <strong>85%</strong>
        </div>
        <div class="summary-tile summary-tile--toggle">
          <span>Fenêtre</span>
          <div class="window-toggle">
            <button
              class="toggle-btn"
              [class.toggle-btn--active]="window() === 7"
              (click)="setWindow(7)">
              7J
            </button>
            <button
              class="toggle-btn"
              [class.toggle-btn--active]="window() === 30"
              (click)="setWindow(30)">
              30J
            </button>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="state-panel">
          <div class="skeleton-chart"></div>
        </div>
      }

      @if (error()) {
        <div class="state-panel state-panel--error">
          <div class="state-icon">
            <span class="material-icons">warning_amber</span>
          </div>
          <div class="state-content">
            <strong>{{ errorMessage() }}</strong>
            <span>Le service de prévision n'a pas répondu correctement.</span>
          </div>
        </div>
      }

      @if (!loading() && !error()) {
        <div class="chart-frame">
          <canvas #chartCanvas width="800" height="300"></canvas>
        </div>
      }
    </section>
  `,
  styles: [`
    .forecast-card {
      position: relative;
      overflow: hidden;
      padding: 20px;
      border-radius: 24px;
      background:
        radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 28%),
        linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid rgba(148, 163, 184, 0.22);
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
    }

    .forecast-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }

    .eyebrow {
      margin: 0 0 8px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 11px;
      font-weight: 700;
      color: #0ea5e9;
    }

    .forecast-header h4 {
      margin: 0;
      font-size: clamp(20px, 2.2vw, 28px);
      color: var(--color-text, #0f172a);
    }

    .forecast-copy {
      margin: 8px 0 0;
      max-width: 62ch;
      color: var(--color-text-muted, #64748b);
      font-size: 14px;
      line-height: 1.6;
    }

    .forecast-status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 999px;
      background: #ecfeff;
      color: #155e75;
      border: 1px solid rgba(14, 165, 233, 0.18);
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
    }

    .forecast-status--error {
      background: #fef2f2;
      color: #b91c1c;
      border-color: rgba(239, 68, 68, 0.2);
    }

    .forecast-status--live {
      background: #ecfdf5;
      color: #166534;
      border-color: rgba(34, 197, 94, 0.2);
    }

    .forecast-status__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 0 6px color-mix(in srgb, currentColor 15%, transparent);
    }

    .forecast-summary {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }

    .summary-tile {
      padding: 16px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.78);
      border: 1px solid var(--color-border, #e2e8f0);
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
    }

    .summary-tile span {
      display: block;
      margin-bottom: 8px;
      font-size: 12px;
      color: var(--color-text-muted, #64748b);
    }

    .summary-tile strong {
      font-size: 24px;
      line-height: 1;
      color: var(--color-text, #0f172a);
    }

    .summary-tile--accent {
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(14, 165, 233, 0.95) 100%);
      border-color: transparent;
    }

    .summary-tile--accent span,
    .summary-tile--accent strong {
      color: #fff;
    }

    .summary-tile--toggle {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .window-toggle {
      display: flex;
      gap: 4px;
      background: #f1f5f9;
      border-radius: 10px;
      padding: 3px;
    }

    .toggle-btn {
      flex: 1;
      padding: 8px 14px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      background: transparent;
      color: #64748b;
    }

    .toggle-btn--active {
      background: #0ea5e9;
      color: #fff;
      box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
    }

    .toggle-btn:not(.toggle-btn--active):hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .state-panel {
      min-height: 320px;
      border-radius: 20px;
      background: linear-gradient(180deg, rgba(248, 250, 252, 0.95), rgba(255, 255, 255, 0.95));
      border: 1px solid var(--color-border, #e2e8f0);
      overflow: hidden;
    }

    .state-panel--error {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      min-height: auto;
      background: #fff7f7;
      border-color: #fecaca;
    }

    .state-icon {
      display: grid;
      place-items: center;
      width: 52px;
      height: 52px;
      border-radius: 16px;
      background: #fee2e2;
      color: #dc2626;
      flex: 0 0 auto;
    }

    .state-icon .material-icons {
      font-size: 28px;
    }

    .state-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .state-content strong {
      color: #991b1b;
      font-size: 15px;
    }

    .state-content span {
      color: #7f1d1d;
      font-size: 13px;
    }

    .skeleton-chart {
      height: 320px;
      background:
        linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%) 0 0 / 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }

    .chart-frame {
      position: relative;
      height: 340px;
      padding: 12px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.88);
      border: 1px solid var(--color-border, #e2e8f0);
    }

    .chart-frame canvas {
      width: 100% !important;
      height: 100% !important;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @media (max-width: 900px) {
      .forecast-header {
        flex-direction: column;
      }

      .forecast-summary {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class BedForecastComponent implements OnInit, OnDestroy {
  private readonly chefApi = inject(ChefApiService);

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  readonly forecast = signal<ForecastDay[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly errorMessage = signal('Prévision indisponible. Veuillez réessayer plus tard.');
  readonly window = signal<7 | 30>(30);

  readonly visibleForecast = computed(() => this.forecast().slice(0, this.window()));

  readonly todayOccupancy = computed(() =>
    this.forecast().length > 0 ? this.forecast()[0].occupancy_pct : null
  );

  private chart: Chart | null = null;
  private chartInitialized = false;

  ngOnInit(): void {
    this.chefApi.getOccupancyForecast().subscribe({
      next: (data) => {
        this.forecast.set(data);
        this.loading.set(false);
        setTimeout(() => this.initChart(), 50);
      },
      error: (err) => {
        this.setErrorMessage(err);
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  setWindow(days: 7 | 30): void {
    this.window.set(days);
    this.updateChart();
  }

  private setErrorMessage(err: unknown): void {
    if (err instanceof HttpErrorResponse) {
      const apiMessage = err.error?.message;

      if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
        this.errorMessage.set(apiMessage);
        return;
      }

      if (typeof err.message === 'string' && err.message.trim().length > 0) {
        this.errorMessage.set(err.message);
        return;
      }

      if (err.status === 0) {
        this.errorMessage.set('Impossible de joindre le serveur de prévision.');
        return;
      }

      this.errorMessage.set(`Prévision indisponible (HTTP ${err.status}).`);
      return;
    }

    this.errorMessage.set('Prévision indisponible. Veuillez réessayer plus tard.');
  }

  private updateChart(): void {
    if (!this.chart) return;

    const sliced = this.visibleForecast();
    const data = sliced.map(d => d.occupancy_pct);
    const labels = sliced.map(d => `J+${d.day}`);
    const maxValue = Math.max(...data, 0);
    const yMax = maxValue < 10 ? 20 : 100;

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;

    const yScale = this.chart.options.scales!['y'] as any;
    yScale.max = yMax;
    yScale.ticks.stepSize = yMax <= 20 ? 5 : 20;

    const annotations = (this.chart.options.plugins as any).annotation.annotations;
    annotations.threshold.display = yMax >= 85;
    if (annotations.threshold.label) {
      annotations.threshold.label.display = yMax >= 85;
    }

    this.chart.update('none');
  }

  private initChart(): void {
    if (this.chartInitialized) return;
    if (!this.chartCanvas?.nativeElement) {
      setTimeout(() => this.initChart(), 100);
      return;
    }

    const canvas = this.chartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.chartInitialized = true;

    const sliced = this.visibleForecast();
    const data = sliced.map(d => d.occupancy_pct);
    const maxValue = Math.max(...data, 0);
    const yMax = maxValue < 10 ? 20 : 100;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: sliced.map(d => `J+${d.day}`),
        datasets: [{
          label: 'Occupation (%)',
          data: data,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.12)',
          borderWidth: 3,
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: '#0ea5e9',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          y: {
            min: 0,
            max: yMax,
            grid: {
              color: 'rgba(148, 163, 184, 0.18)',
            },
            ticks: {
              color: '#64748b',
              stepSize: yMax <= 20 ? 5 : 20,
            },
            title: { display: true, text: 'Occupation (%)' }
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#64748b',
              maxTicksLimit: 15,
            },
            title: { display: true, text: 'Jour' }
          }
        },
        plugins: {
          legend: {
            display: false,
          },
          annotation: {
            annotations: {
              threshold: {
                type: 'line',
                yMin: 85,
                yMax: 85,
                borderColor: '#dc2626',
                borderWidth: 2,
                borderDash: [6, 4],
                display: yMax >= 85,
                label: {
                  display: yMax >= 85,
                  content: 'Seuil critique (85%)',
                  position: 'end'
                }
              }
            }
          }
        }
      }
    });
  }
}
