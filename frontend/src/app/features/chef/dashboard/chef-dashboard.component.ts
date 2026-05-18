import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/ui/stat-card/stat-card.component';
import { ChefApiService, DashboardKpi } from '../chef.service';

@Component({
  selector: 'app-chef-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, StatCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hm-page-header
      [title]="serviceName()"
      subtitle="Tableau de bord du service"
      icon="dashboard">
    </hm-page-header>

    <div class="kpi-grid">
      <hm-stat-card
        label="Boxes"
        [value]="boxCount()"
        icon="meeting_room"
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
      </hm-stat-card>

      <hm-stat-card
        label="Médecins"
        [value]="doctorCount()"
        icon="medical_services"
        gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
      </hm-stat-card>

      <hm-stat-card
        label="Patients aujourd'hui"
        [value]="todayPatientCount()"
        icon="people"
        gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
      </hm-stat-card>

      <hm-stat-card
        label="Consultations actives"
        [value]="activeConsultationCount()"
        icon="local_hospital"
        gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
      </hm-stat-card>
    </div>

    <nav class="nav-tabs">
      <a routerLink="/chef/boxes" class="nav-tab">
        <span class="material-icons">meeting_room</span>
        Boxes
      </a>
      <a routerLink="/chef/medecins" class="nav-tab">
        <span class="material-icons">medical_services</span>
        Médecins
      </a>
      <a routerLink="/chef/planning" class="nav-tab">
        <span class="material-icons">calendar_month</span>
        Planning
      </a>
      <a routerLink="/chef/statistiques" class="nav-tab">
        <span class="material-icons">bar_chart</span>
        Statistiques
      </a>
    </nav>
  `,
  styles: [`
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .nav-tabs {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .nav-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: var(--radius-md, 10px);
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e2e8f0);
      color: var(--color-text, #0f172a);
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      transition: all 0.2s ease;
    }

    .nav-tab:hover {
      background: var(--color-primary-light, rgba(0, 188, 212, 0.08));
      border-color: var(--color-primary, #00BCD4);
      color: var(--color-primary, #00BCD4);
    }

    .nav-tab .material-icons {
      font-size: 20px;
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
