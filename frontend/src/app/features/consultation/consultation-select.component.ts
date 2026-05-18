import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner.component';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

interface ServiceCard {
  id: number;
  name: string;
  code?: string;
}

interface BoxCard {
  id: number;
  name: string;
  label_fr: string;
  type: string;
  is_active: boolean;
}

@Component({
  selector: 'app-consultation-select',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hm-page-header
      [title]="pageTitle()"
      [subtitle]="pageSubtitle()"
      icon="medical_services">
    </hm-page-header>

    @if (step() === 'services') {
      @if (loading()) {
        <hm-spinner label="Chargement des services..." />
      } @else {
        <div class="cards-grid">
          @for (service of services(); track service.id) {
            <div class="selection-card" (click)="selectService(service)">
              <span class="material-icons card-icon">local_hospital</span>
              <span class="card-label">{{ service.name }}</span>
            </div>
          } @empty {
            <div class="empty-state">
              <span class="material-icons">info</span>
              <p>Aucun service assigné.</p>
            </div>
          }
        </div>
      }
    }

    @if (step() === 'boxes') {
      <div class="breadcrumb-nav">
        <button class="btn-back" (click)="backToServices()">
          <span class="material-icons">arrow_back</span>
          Retour aux services
        </button>
        <span class="breadcrumb-current">{{ selectedService()?.name }}</span>
      </div>

      @if (loading()) {
        <hm-spinner label="Chargement des boxes..." />
      } @else {
        <div class="cards-grid">
          @for (box of boxes(); track box.id) {
            <div class="selection-card" [class.card-inactive]="!box.is_active" (click)="selectBox(box)">
              <span class="material-icons card-icon">meeting_room</span>
              <span class="card-label">{{ box.label_fr || box.name }}</span>
              <span class="card-type">{{ box.type }}</span>
            </div>
          } @empty {
            <div class="empty-state">
              <span class="material-icons">info</span>
              <p>Aucune box disponible dans ce service.</p>
            </div>
          }
        </div>
      }
    }
  `,
  styles: [`
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }

    .selection-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 28px 20px;
      border-radius: var(--radius-lg, 14px);
      background: var(--color-surface, #fff);
      border: 2px solid var(--color-border, #e2e8f0);
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }

    .selection-card:hover {
      border-color: var(--color-primary, #00BCD4);
      background: rgba(0, 188, 212, 0.04);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 188, 212, 0.15);
    }

    .selection-card.card-inactive {
      opacity: 0.5;
      pointer-events: none;
    }

    .card-icon {
      font-size: 40px;
      color: var(--color-primary, #00BCD4);
      background: rgba(0, 188, 212, 0.08);
      padding: 14px;
      border-radius: 50%;
    }

    .card-label {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
    }

    .card-type {
      font-size: 12px;
      color: var(--color-text-muted, #64748b);
      text-transform: capitalize;
      background: var(--color-surface-alt, #f1f5f9);
      padding: 3px 10px;
      border-radius: 12px;
    }

    .breadcrumb-nav {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--color-border, #e2e8f0);
      background: var(--color-surface, #fff);
      color: var(--color-text-muted, #64748b);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-back:hover {
      border-color: var(--color-primary, #00BCD4);
      color: var(--color-primary, #00BCD4);
    }

    .btn-back .material-icons {
      font-size: 16px;
    }

    .breadcrumb-current {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 40px;
      color: var(--color-text-muted, #64748b);
    }

    .empty-state .material-icons {
      font-size: 40px;
      opacity: 0.5;
      margin-bottom: 8px;
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--color-text-muted, #64748b);
      font-size: 14px;
    }
  `]
})
export class ConsultationSelectComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly API = environment.baseUrl;

  readonly step = signal<'services' | 'boxes'>('services');
  readonly loading = signal(true);
  readonly services = signal<ServiceCard[]>([]);
  readonly boxes = signal<BoxCard[]>([]);
  readonly selectedService = signal<ServiceCard | null>(null);

  readonly pageTitle = signal('Consultation');
  readonly pageSubtitle = signal('Sélectionnez votre service');

  ngOnInit(): void {
    this.loadServices();
  }

  selectService(service: ServiceCard): void {
    this.selectedService.set(service);
    this.step.set('boxes');
    this.pageTitle.set(service.name);
    this.pageSubtitle.set('Sélectionnez une box de consultation');
    this.loadBoxes(service.id);
  }

  selectBox(box: BoxCard): void {
    // Navigate to the queue screen with service and box context
    this.router.navigate(['/queue/call'], {
      queryParams: {
        service_id: this.selectedService()!.id,
        box_id: box.id
      }
    });
  }

  backToServices(): void {
    this.step.set('services');
    this.selectedService.set(null);
    this.pageTitle.set('Consultation');
    this.pageSubtitle.set('Sélectionnez votre service');
  }

  private loadServices(): void {
    const user = this.auth.currentUser();
    if (user?.services && user.services.length > 0) {
      this.services.set(user.services);
      this.loading.set(false);
    } else {
      // Fallback: fetch from API
      this.loading.set(true);
      this.http.get<any[]>(`${this.API}/clinical-core/services`).subscribe({
        next: (res: any) => {
          const data = res.data ?? res;
          this.services.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  private loadBoxes(serviceId: number): void {
    this.loading.set(true);
    this.http.get<any>(`${this.API}/clinical-core/services/${serviceId}/boxes`).subscribe({
      next: (res: any) => {
        const data = res.data ?? res;
        this.boxes.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
