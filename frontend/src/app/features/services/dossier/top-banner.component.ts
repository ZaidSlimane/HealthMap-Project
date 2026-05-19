import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

/**
 * Computes the age in full years from a date-of-birth string (ISO format: YYYY-MM-DD).
 * Returns the floor of the year difference, accounting for whether the birthday
 * has already occurred this year.
 */
export function computeAge(dateOfBirth: string): number {
  const today = new Date();
  const dob = new Date(dateOfBirth);

  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

export interface TopBannerData {
  patient: {
    name: string;
    first_name: string;
    date_of_birth: string;
  };
  admission: {
    id: number;
    date_admission: string;
  };
  service: {
    id: number;
    name: string;
  };
  bed: {
    bed_number: string | number;
  };
}

@Component({
  selector: 'app-top-banner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="top-banner">
      <!-- Green card: Patient info -->
      <div class="banner-card banner-patient">
        <span class="material-icons banner-icon">person</span>
        <div class="banner-content">
          <div class="banner-label">Patient</div>
          <div class="banner-value">{{ dossierData().patient.name }} {{ dossierData().patient.first_name }}</div>
          <div class="banner-sub">
            {{ dossierData().patient.date_of_birth | date:'dd/MM/yyyy' }} — {{ patientAge }} ans
          </div>
        </div>
      </div>

      <!-- Orange card: Admission info -->
      <div class="banner-card banner-admission">
        <span class="material-icons banner-icon">local_hospital</span>
        <div class="banner-content">
          <div class="banner-label">Admission</div>
          <div class="banner-value">N° {{ dossierData().admission.id }}</div>
          <div class="banner-sub">{{ dossierData().admission.date_admission | date:'dd/MM/yyyy HH:mm' }}</div>
        </div>
      </div>

      <!-- Blue card: Service & Bed info -->
      <div class="banner-card banner-service">
        <span class="material-icons banner-icon">hotel</span>
        <div class="banner-content">
          <div class="banner-label">Service</div>
          <div class="banner-value">{{ dossierData().service.name }}</div>
          <div class="banner-sub">Lit {{ dossierData().bed.bed_number }}</div>
        </div>
      </div>

      <!-- Navigation button -->
      <button class="btn-back" (click)="navigateBack()">
        <span class="material-icons">arrow_back</span>
        Revenir au service
      </button>
    </div>
  `,
  styles: [`
    .top-banner {
      display: flex;
      align-items: stretch;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .banner-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      border-radius: var(--radius-md, 10px);
      flex: 1;
      min-width: 180px;
      color: #fff;
    }

    .banner-patient { background: #16a34a; }
    .banner-admission { background: #ea580c; }
    .banner-service { background: #2563eb; }

    .banner-icon { font-size: 28px; opacity: 0.8; }

    .banner-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .banner-label {
      font-size: 11px;
      opacity: 0.85;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .banner-value {
      font-size: 15px;
      font-weight: 700;
    }

    .banner-sub {
      font-size: 12px;
      opacity: 0.85;
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--color-border, #e2e8f0);
      background: var(--color-surface, #fff);
      color: var(--color-text-muted, #64748b);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      align-self: center;
      white-space: nowrap;
      transition: all 0.2s ease;
    }

    .btn-back:hover {
      border-color: var(--color-primary, #00BCD4);
      color: var(--color-primary, #00BCD4);
    }

    .btn-back .material-icons { font-size: 16px; }

    @media (max-width: 768px) {
      .top-banner {
        flex-direction: column;
      }

      .banner-card {
        min-width: unset;
      }
    }
  `]
})
export class TopBannerComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly dossierData = input.required<TopBannerData>();

  get patientAge(): number {
    return computeAge(this.dossierData().patient.date_of_birth);
  }

  navigateBack(): void {
    const serviceId = this.route.snapshot.paramMap.get('serviceId')
      ?? this.dossierData().service.id;
    this.router.navigate(['/services', serviceId]);
  }
}
