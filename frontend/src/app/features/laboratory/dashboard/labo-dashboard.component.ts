import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { environment } from '../../../../environments/environment';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';

interface LaboDashboardVm {
  bilan: number;
  delai_attente: number;
  examens_en_attente: number;
  monthly_analysis: { label: string; value: number }[];
  daily_analysis: { label: string; value: number }[];
}

@Component({
  selector: 'app-labo-dashboard',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hm-page-header
      title="Tableau de bord Laboratoire"
      subtitle="Vue d'ensemble de l'activité du laboratoire"
      icon="science">
    </hm-page-header>

    @if (loading()) {
      <hm-spinner label="Chargement du tableau de bord..." />
    } @else {
      <!-- KPI Row -->
      <div class="kpi-row">
        <div class="kpi-card kpi-primary">
          <div class="kpi-header">
            <span class="kpi-title">Bilan</span>
            <span class="kpi-status">Actif</span>
          </div>
          <div class="kpi-value">{{ vm()?.bilan ?? 0 }}</div>
          <div class="kpi-helper">Analyses actives</div>
        </div>

        <div class="kpi-card kpi-warning">
          <div class="kpi-header">
            <span class="kpi-title">Délai d'attente</span>
            @if ((vm()?.delai_attente ?? 0) > 30) {
              <span class="kpi-status kpi-status-elevated">Élevé</span>
            }
          </div>
          <div class="kpi-value">{{ vm()?.delai_attente ?? 0 }}<span class="kpi-suffix">min</span></div>
          <div class="kpi-helper">Délai moyen</div>
        </div>

        <div class="kpi-card kpi-danger-soft">
          <div class="kpi-header">
            <span class="kpi-title">Examens en attente</span>
            @if ((vm()?.examens_en_attente ?? 0) > 0) {
              <span class="kpi-status kpi-status-action">À traiter</span>
            } @else {
              <span class="kpi-status kpi-status-ok">OK</span>
            }
          </div>
          <div class="kpi-value">{{ vm()?.examens_en_attente ?? 0 }}</div>
          <div class="kpi-helper">Examens sans résultat</div>
        </div>
      </div>

      <!-- Activity Chart -->
      <div class="chart-card">
        <div class="chart-header">
          <h3 class="chart-title">Activité</h3>
          <div class="chart-toggle">
            <button
              class="toggle-btn"
              [class.active]="chartMode() === 'daily'"
              (click)="switchChart('daily')">
              Quotidien
            </button>
            <button
              class="toggle-btn"
              [class.active]="chartMode() === 'monthly'"
              (click)="switchChart('monthly')">
              Mensuel
            </button>
          </div>
        </div>
        <div class="chart-container">
          @if (isChartEmpty()) {
            <div class="chart-empty-state">
              <span class="material-icons chart-empty-icon">show_chart</span>
              <p class="chart-empty-text">Aucune activité sur la période sélectionnée</p>
            </div>
          }
          <canvas #chartCanvas [class.hidden]="isChartEmpty()"></canvas>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="actions-row">
        <div class="action-card" (click)="navigate('/laboratory/historique')">
          <span class="material-icons action-icon">history</span>
          <div class="action-text">
            <span class="action-title">Historique d'activité par service</span>
            <span class="action-desc">Consulter les analyses passées</span>
          </div>
          <span class="material-icons action-arrow">chevron_right</span>
        </div>
        <div class="action-card" (click)="navigate('/laboratory/gestion')">
          <span class="material-icons action-icon">settings</span>
          <div class="action-text">
            <span class="action-title">Gestion du laboratoire</span>
            <span class="action-desc">Paramètres et configuration</span>
          </div>
          <span class="material-icons action-arrow">chevron_right</span>
        </div>
      </div>
    }
  `,
  styles: [`
    /* KPI Row */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: var(--color-surface, #fff);
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--color-border, #e2e8f0);
      padding: 20px;
      display: flex;
      flex-direction: column;
      min-height: 120px;
      transition: box-shadow 0.2s ease;
    }

    .kpi-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }

    .kpi-primary {
      border-left: 4px solid var(--color-primary, #00BCD4);
    }

    .kpi-warning {
      border-left: 4px solid #f59e0b;
    }

    .kpi-danger {
      border-left: 4px solid #ef4444;
    }

    .kpi-danger-soft {
      border-left: 4px solid #f87171;
      background: linear-gradient(135deg, #fff 0%, #fef2f2 100%);
    }

    .kpi-neutral {
      border-left: 4px solid var(--color-border, #e2e8f0);
    }

    .kpi-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .kpi-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .kpi-status {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      background: rgba(0, 188, 212, 0.1);
      color: var(--color-primary, #00BCD4);
    }

    .kpi-status-elevated {
      background: rgba(245, 158, 11, 0.1);
      color: #d97706;
    }

    .kpi-status-action {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    .kpi-status-ok {
      background: rgba(22, 163, 74, 0.1);
      color: #16a34a;
    }

    .kpi-value {
      font-size: 32px;
      font-weight: 800;
      color: var(--color-text, #0f172a);
      line-height: 1;
      margin-top: auto;
    }

    .kpi-suffix {
      font-size: 16px;
      font-weight: 500;
      color: var(--color-text-muted, #64748b);
      margin-left: 4px;
    }

    .kpi-helper {
      font-size: 12px;
      color: var(--color-text-muted, #64748b);
      margin-top: 6px;
    }

    /* Chart Card */
    .chart-card {
      background: var(--color-surface, #fff);
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--color-border, #e2e8f0);
      padding: 20px;
      margin-bottom: 24px;
    }

    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .chart-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
    }

    .chart-toggle {
      display: flex;
      gap: 4px;
      background: var(--color-surface-alt, #f8fafc);
      border-radius: var(--radius-sm, 6px);
      padding: 3px;
    }

    .toggle-btn {
      padding: 6px 14px;
      border: none;
      border-radius: var(--radius-sm, 6px);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      background: transparent;
      color: var(--color-text-muted, #64748b);
      transition: all 0.2s ease;
    }

    .toggle-btn.active {
      background: var(--color-primary, #00BCD4);
      color: #fff;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(0, 188, 212, 0.4);
    }

    .chart-container {
      position: relative;
      height: 260px;
    }

    .chart-container canvas {
      width: 100% !important;
      height: 100% !important;
    }

    .chart-container canvas.hidden {
      display: none;
    }

    .chart-empty-state {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .chart-empty-icon {
      font-size: 48px;
      color: var(--color-text-muted, #94a3b8);
      opacity: 0.4;
    }

    .chart-empty-text {
      margin: 0;
      font-size: 14px;
      color: var(--color-text-muted, #64748b);
      font-style: italic;
    }

    /* Quick Actions */
    .actions-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .action-card {
      display: flex;
      align-items: center;
      gap: 14px;
      background: var(--color-surface, #fff);
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--color-border, #e2e8f0);
      padding: 18px 20px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-card:hover {
      border-color: var(--color-primary, #00BCD4);
      box-shadow: 0 4px 12px rgba(0, 188, 212, 0.1);
    }

    .action-icon {
      font-size: 24px;
      color: var(--color-primary, #00BCD4);
      background: rgba(0, 188, 212, 0.08);
      padding: 10px;
      border-radius: var(--radius-sm, 6px);
    }

    .action-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .action-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
    }

    .action-desc {
      font-size: 12px;
      color: var(--color-text-muted, #64748b);
    }

    .action-arrow {
      font-size: 20px;
      color: var(--color-text-muted, #64748b);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .kpi-row {
        grid-template-columns: 1fr;
      }

      .actions-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LaboDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly vm = signal<LaboDashboardVm | null>(null);
  readonly chartMode = signal<'daily' | 'monthly'>('daily');

  /** Whether the current chart dataset has all zero values */
  get isChartEmpty(): () => boolean {
    return () => {
      const data = this.chartMode() === 'daily'
        ? this.vm()?.daily_analysis
        : this.vm()?.monthly_analysis;
      if (!data || data.length === 0) return true;
      return data.every(d => d.value === 0);
    };
  }

  private chart: Chart | null = null;

  constructor() {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.http.get<LaboDashboardVm>(`${environment.baseUrl}/laboratory/dashboard`).subscribe({
      next: (data) => {
        this.vm.set(data);
        this.loading.set(false);
        // Chart will be rendered in AfterViewInit or after loading completes
        setTimeout(() => this.renderChart(), 0);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.vm()) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  switchChart(mode: 'daily' | 'monthly'): void {
    this.chartMode.set(mode);
    this.renderChart();
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  private renderChart(): void {
    if (!this.chartCanvas?.nativeElement || !this.vm()) return;

    this.chart?.destroy();

    const data = this.chartMode() === 'daily'
      ? this.vm()!.daily_analysis
      : this.vm()!.monthly_analysis;

    const ctx = this.chartCanvas.nativeElement.getContext('2d')!;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: this.chartMode() === 'daily' ? 'Analyses / jour' : 'Analyses / mois',
          data: data.map(d => d.value),
          borderColor: '#00BCD4',
          backgroundColor: 'rgba(0, 188, 212, 0.08)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#00BCD4',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#64748b',
              font: { size: 12 },
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0, 0, 0, 0.04)' },
            ticks: {
              color: '#64748b',
              font: { size: 12 },
              stepSize: 1,
            }
          }
        }
      }
    });
  }
}
