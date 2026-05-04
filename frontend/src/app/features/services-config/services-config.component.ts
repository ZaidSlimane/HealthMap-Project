import {
  Component, signal, computed, inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ServiceCardComponent } from './components/service-card/service-card.component';
import { ServiceDrawerComponent } from './components/service-drawer/service-drawer.component';
import {
  ServiceConfig, ServiceType, ALL_SERVICE_TYPES, TYPE_COLOR,
  totalLitsService, litsOccupesService, totalSallesService
} from './models/service-config.model';
import { ServicesStore } from './services-store';

@Component({
  selector: 'hm-services-config',
  standalone: true,
  imports: [CommonModule, FormsModule, ServiceCardComponent, ServiceDrawerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './services-config.component.html',
  styleUrl: './services-config.component.scss',
})
export class ServicesConfigComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private store = inject(ServicesStore);

  constructor() { this.store.ensureLoaded(); }

  services    = this.store.services;
  loading     = this.store.loading;
  loadError   = this.store.error;
  searchQuery = signal('');
  activeFilter = signal<ServiceType | 'TOUS'>('TOUS');

  drawerOpen  = signal(false);
  drawerMode  = signal<'ADD' | 'EDIT'>('ADD');
  selectedSvc = signal<ServiceConfig | null>(null);
  litsMode    = signal(false);

  filteredServices = computed(() => {
    const q    = this.searchQuery().toLowerCase();
    const type = this.activeFilter();
    return this.services().filter(s =>
      (type === 'TOUS' || s.type === type) &&
      s.name.toLowerCase().includes(q)
    );
  });

  totalServices = computed(() => this.services().length);
  totalUnites   = computed(() => this.services().reduce((a, s) => a + s.units.length, 0));
  totalSalles   = computed(() => this.services().reduce((a, s) => a + totalSallesService(s), 0));
  totalLits     = computed(() => this.services().reduce((a, s) => a + totalLitsService(s), 0));
  totalOccupes  = computed(() => this.services().reduce((a, s) => a + litsOccupesService(s), 0));

  globalOccPct = computed(() => {
    const t = this.totalLits();
    return t > 0 ? Math.round((this.totalOccupes() / t) * 100) : 0;
  });

  allTypes = ALL_SERVICE_TYPES;
  typeColor(t: ServiceType): string { return TYPE_COLOR[t] ?? '#546E7A'; }

  get userRole(): 'superadmin' | 'admin' | 'medecin' {
    const r = this.auth.getUserRole();
    if (r === 'superadmin') return 'superadmin';
    if (r === 'Admin') return 'admin';
    return 'medecin';
  }

  openAdd(): void {
    this.drawerMode.set('ADD');
    this.selectedSvc.set(null);
    this.litsMode.set(false);
    this.drawerOpen.set(true);
  }

  openEdit(s: ServiceConfig): void {
    this.drawerMode.set('EDIT');
    this.selectedSvc.set(s);
    this.litsMode.set(false);
    this.drawerOpen.set(true);
  }

  openLits(s: ServiceConfig): void {
    this.router.navigate(['/admin/services', s.id, 'lits']);
  }

  closeDrawer(): void { this.drawerOpen.set(false); }

  async onSave(s: ServiceConfig): Promise<void> {
    try {
      await this.store.upsert(s);
      this.closeDrawer();
    } catch (e: any) {
      alert(`Erreur d'enregistrement : ${e?.message ?? e}`);
    }
  }

  async onDelete(id: string): Promise<void> {
    if (!confirm('Supprimer ce service ? Cette action est irréversible.')) return;
    try {
      await this.store.remove(id);
    } catch (e: any) {
      alert(`Erreur de suppression : ${e?.message ?? e}`);
    }
  }

  setFilter(t: ServiceType | 'TOUS'): void { this.activeFilter.set(t); }

  sparklinePoints(pts: number[]): string {
    const max = Math.max(...pts, 1);
    return pts.map((v, i) => `${i * 9},${24 - (v / max) * 20}`).join(' ');
  }

  readonly kpiCards = [
    {
      label: 'Services', icon: 'local_hospital',
      value: this.totalServices,
      gradient: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
      sparkline: [5,7,6,8,9,10,11],
    },
    {
      label: 'Unités', icon: 'domain',
      value: this.totalUnites,
      gradient: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
      sparkline: [10,14,15,17,16,18,20],
    },
    {
      label: 'Salles', icon: 'meeting_room',
      value: this.totalSalles,
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      sparkline: [8,10,12,13,15,17,19],
    },
    {
      label: 'Lits', icon: 'bed',
      value: this.totalLits,
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      sparkline: [20,28,30,35,40,42,48],
    },
  ];
}
