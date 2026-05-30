import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/ui/stat-card/stat-card.component';
import { ChefApiService, DashboardKpi } from '../chef.service';
import { BedForecastComponent } from '../bed-forecast/bed-forecast.component';

@Component({
  selector: 'app-chef-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, StatCardComponent, BedForecastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero-shell">
      <hm-page-header
        [title]="serviceName() || 'Tableau de bord chef de service'"
        subtitle="Vue d'ensemble des indicateurs, des boxes et des prévisions"
        icon="dashboard">
        <span class="hero-badge">
          <span class="hero-badge__dot"></span>
          Service actif
        </span>
      </hm-page-header>

      <div class="hero-panel">
        <div class="hero-copy">
          <p class="eyebrow">Pilotage quotidien</p>
          <h2>Lecture rapide de la charge clinique et de la trajectoire des lits.</h2>
          <p class="hero-text">
            Les indicateurs sont regroupes pour reduire le temps de scan et mettre la prevision au centre de la decision.
          </p>
        </div>

        <div class="hero-metrics">
          <div class="hero-metric">
            <span class="hero-metric__label">Boxes</span>
            <strong>{{ boxCount() }}</strong>
          </div>
          <div class="hero-metric">
            <span class="hero-metric__label">Medecins</span>
            <strong>{{ doctorCount() }}</strong>
          </div>
          <div class="hero-metric">
            <span class="hero-metric__label">Patients aujourd'hui</span>
            <strong>{{ todayPatientCount() }}</strong>
          </div>
          <div class="hero-metric">
            <span class="hero-metric__label">Consultations actives</span>
            <strong>{{ activeConsultationCount() }}</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="stats-section">
      <div class="kpi-grid">
        <hm-stat-card
          label="Boxes"
          [value]="boxCount()"
          icon="meeting_room"
          gradient="linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)">
        </hm-stat-card>

        <hm-stat-card
          label="Medecins"
          [value]="doctorCount()"
          icon="medical_services"
          gradient="linear-gradient(135deg, #7c3aed 0%, #db2777 100%)">
        </hm-stat-card>

        <hm-stat-card
          label="Patients aujourd'hui"
          [value]="todayPatientCount()"
          icon="people"
          gradient="linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)">
        </hm-stat-card>

        <hm-stat-card
          label="Consultations actives"
          [value]="activeConsultationCount()"
          icon="local_hospital"
          gradient="linear-gradient(135deg, #16a34a 0%, #84cc16 100%)">
        </hm-stat-card>
      </div>
    </section>

    <section class="forecast-section">
      <div class="section-head">
        <div>
          <p class="eyebrow">Prevision des lits</p>
          <h3>Lecture des 30 prochains jours</h3>
        </div>
        <div class="section-chip">
          <span class="section-chip__dot"></span>
          Seuil critique 85%
        </div>
      </div>
      <app-bed-forecast></app-bed-forecast>
    </section>

    <section class="nav-section">
      <div class="section-head">
        <div>
          <p class="eyebrow">Acces rapides</p>
          <h3>Operations du service</h3>
        </div>
      </div>
      <nav class="nav-tabs">
        <a routerLink="/chef/boxes" class="nav-tab">
          <span class="material-icons">meeting_room</span>
          <span>
            <strong>Boxes</strong>
            <small>Gestion des affectations</small>
          </span>
        </a>
        <a routerLink="/chef/medecins" class="nav-tab">
          <span class="material-icons">medical_services</span>
          <span>
            <strong>Medecins</strong>
            <small>Equipe et planning</small>
          </span>
        </a>
        <a routerLink="/chef/planning" class="nav-tab">
          <span class="material-icons">calendar_month</span>
          <span>
            <strong>Planning</strong>
            <small>Organisation de service</small>
          </span>
        </a>
        <a routerLink="/chef/statistiques" class="nav-tab">
          <span class="material-icons">bar_chart</span>
          <span>
            <strong>Statistiques</strong>
            <small>Analyse des flux</small>
          </span>
        </a>
      </nav>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }

    .hero-shell,
    .stats-section,
    .forecast-section,
    .nav-section {
      margin-bottom: 24px;
    }

    .hero-panel {
      position: relative;
      overflow: hidden;
      display: grid;
      grid-template-columns: minmax(0, 1.3fr) minmax(260px, 0.9fr);
      gap: 20px;
      padding: 24px;
      border-radius: 24px;
      background:
        radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 34%),
        linear-gradient(135deg, #081120 0%, #0f172a 46%, #111827 100%);
      color: #e2e8f0;
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24);
    }

    .hero-panel::after {
      content: '';
      position: absolute;
      inset: auto -10% -35% auto;
      width: 280px;
      height: 280px;
      border-radius: 50%;
      background: rgba(14, 165, 233, 0.18);
      filter: blur(12px);
      pointer-events: none;
    }

    .hero-copy {
      position: relative;
      z-index: 1;
      max-width: 720px;
    }

    .eyebrow {
      margin: 0 0 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 11px;
      font-weight: 700;
      color: #93c5fd;
    }

    .hero-copy h2 {
      margin: 0;
      font-size: clamp(24px, 3vw, 38px);
      line-height: 1.05;
      color: #f8fafc;
      max-width: 12ch;
    }

    .hero-text {
      margin: 14px 0 0;
      max-width: 58ch;
      color: rgba(226, 232, 240, 0.8);
      font-size: 14px;
      line-height: 1.7;
    }

    .hero-metrics {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      align-content: center;
    }

    .hero-metric {
      padding: 16px;
      border-radius: 18px;
      background: rgba(15, 23, 42, 0.46);
      border: 1px solid rgba(148, 163, 184, 0.16);
      backdrop-filter: blur(12px);
    }

    .hero-metric__label {
      display: block;
      margin-bottom: 8px;
      font-size: 12px;
      color: #cbd5e1;
    }

    .hero-metric strong {
      display: block;
      font-size: 26px;
      line-height: 1;
      color: #fff;
    }

    .hero-badge,
    .section-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.24);
      background: rgba(255, 255, 255, 0.06);
      color: #e2e8f0;
      font-size: 13px;
      font-weight: 600;
      backdrop-filter: blur(12px);
    }

    .hero-badge__dot,
    .section-chip__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.15);
    }

    .section-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 14px;
    }

    .section-head h3 {
      margin: 0;
      font-size: 20px;
      color: var(--color-text, #0f172a);
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .nav-tabs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }

    .nav-tab {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 18px;
      border-radius: 18px;
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e2e8f0);
      color: var(--color-text, #0f172a);
      text-decoration: none;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      box-shadow: 0 10px 26px rgba(15, 23, 42, 0.04);
    }

    .nav-tab:hover {
      transform: translateY(-2px);
      border-color: #0ea5e9;
      box-shadow: 0 16px 36px rgba(14, 165, 233, 0.12);
    }

    .nav-tab .material-icons {
      font-size: 22px;
      color: #0ea5e9;
    }

    .nav-tab span:last-child {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-tab strong {
      font-size: 14px;
      font-weight: 700;
    }

    .nav-tab small {
      font-size: 12px;
      color: var(--color-text-muted, #64748b);
    }

    @media (max-width: 920px) {
      .hero-panel {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .hero-panel {
        padding: 18px;
        border-radius: 20px;
      }

      .hero-metrics {
        grid-template-columns: 1fr;
      }

      .section-head {
        flex-direction: column;
      }

      .nav-tabs {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ChefDashboardComponent implements OnInit {
  private readonly chefApi = inject(ChefApiService);

  readonly serviceName = signal('');
  readonly boxCount = signal(0);
  readonly doctorCount = signal(0);
  readonly todayPatientCount = signal(0);
  readonly activeConsultationCount = signal(0);

  ngOnInit(): void {
    this.chefApi.getDashboard().subscribe((data: DashboardKpi) => {
      this.serviceName.set(data.service_name);
      this.boxCount.set(data.box_count);
      this.doctorCount.set(data.doctor_count);
      this.todayPatientCount.set(data.today_patient_count);
      this.activeConsultationCount.set(data.active_consultation_count);
    });
  }
}
