import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { PatientStore } from '../data/patient-store';
import { ETAT_SORTIE_META } from '../models/patient.model';

type Tab = 'civil' | 'parcours' | 'facturation' | 'impressions';

@Component({
  selector: 'app-dossier-medical',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dossier-medical.component.html',
  styleUrl: './dossier-medical.component.scss',
})
export class DossierMedicalComponent {
  private store = inject(PatientStore);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  private params = toSignal(this.route.paramMap, { requireSync: true });
  readonly patientId = computed(() => this.params().get('patientId') ?? '');
  readonly bundle = computed(() => this.store.byId(this.patientId()));

  activeTab = signal<Tab>('civil');
  setTab(t: Tab) { this.activeTab.set(t); }

  readonly meta = ETAT_SORTIE_META;

  age(dob: string): number | string {
    if (!dob) return '—';
    const d = new Date(dob); if (isNaN(d.getTime())) return '—';
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  }

  toast = signal<string | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  obtenirMatricule(): void {
    const matricule = 'MAT-' + Math.floor(100000 + Math.random() * 900000);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set(`Matricule national attribué : ${matricule}`);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3500);
  }

  printPlaceholder(label: string): void {
    this.toast.set(`Aperçu « ${label} » prêt — la génération PDF sera branchée plus tard.`);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3500);
  }
}
