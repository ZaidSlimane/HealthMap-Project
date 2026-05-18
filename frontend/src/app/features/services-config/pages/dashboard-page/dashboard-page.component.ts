import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { StatCardComponent } from '../../../../shared/ui/stat-card/stat-card.component';
import { ServiceCardComponent } from '../../components/service-card/service-card.component';
import { ServiceDrawerComponent } from '../../components/service-drawer/service-drawer.component';
import { ServicesFacade } from '../../data-access/services.facade';
import { ServiceConfig } from '../../models/service-config.model';

@Component({
  selector: 'hm-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent, StatCardComponent,
    ServiceCardComponent, ServiceDrawerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  readonly facade = inject(ServicesFacade);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() { this.facade.ensureLoaded(); }

  services = this.facade.services;
  loading = this.facade.loading;

  drawerOpen = signal(false);
  drawerMode = signal<'ADD' | 'EDIT'>('ADD');
  selectedSvc = signal<ServiceConfig | null>(null);

  kpiCards = [
    { label: 'Services', icon: 'local_hospital', value: this.facade.totalServices, gradient: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)' },
    { label: 'Unités', icon: 'domain', value: this.facade.totalUnites, gradient: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' },
    { label: 'Salles', icon: 'meeting_room', value: this.facade.totalSalles, gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' },
    { label: 'Lits', icon: 'bed', value: this.facade.totalLits, gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' },
  ];

  get userRole(): 'superadmin' | 'admin' | 'medecin' {
    const r = this.auth.getUserRole();
    if (r === 'superadmin') return 'superadmin';
    if (r === 'Admin') return 'admin';
    return 'medecin';
  }

  openAdd(): void {
    this.drawerMode.set('ADD');
    this.selectedSvc.set(null);
    this.drawerOpen.set(true);
  }

  openEdit(s: ServiceConfig): void {
    this.drawerMode.set('EDIT');
    this.selectedSvc.set(s);
    this.drawerOpen.set(true);
  }

  openLits(s: ServiceConfig): void {
    this.router.navigate(['/admin/services', s.id, 'lits']);
  }

  closeDrawer(): void { this.drawerOpen.set(false); }

  async onSave(s: ServiceConfig): Promise<void> {
    try {
      await this.facade.upsertService(s);
      this.closeDrawer();
    } catch (e: any) {
      alert(`Erreur : ${e?.message ?? e}`);
    }
  }

  async onDelete(id: string): Promise<void> {
    if (!confirm('Supprimer ce service ? Cette action est irréversible.')) return;
    try {
      await this.facade.removeService(id);
    } catch (e: any) {
      alert(`Erreur : ${e?.message ?? e}`);
    }
  }
}
