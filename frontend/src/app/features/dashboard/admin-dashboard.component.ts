import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { CampusMapComponent } from '../carte/campus-map.component';
import { ConfigurationService } from '../admin/configuration/configuration.service';
import { environment } from '../../../environments/environment';

interface ChartPoint { date: string; admissions: number; radiologie: number; labo: number; }
interface Stat        { label: string; value: number; icon: string; cls: string; }
interface HospitalKpi { label: string; value: number | string; sub: string; icon: string; gradient: string; }

/**
 * Admin dashboard.
 *
 * The headline KPIs (services / beds / occupancy) come straight from the
 * authenticated user's establishment via /api/clinical-core/*. They start
 * at zero on load until the API resolves, and stay at zero for a fresh
 * establishment with no data — no more phantom CHU mocks.
 *
 * Areas not yet wired to a backend (alerts / users / stock / charts /
 * today's stats) keep placeholder values for now.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, CampusMapComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  private cfg = inject(ConfigurationService);
  private http = inject(HttpClient);

  // ── Configured services list ────────────────────────────────────────────
  readonly configuredServices = signal<{ id: number; name: string; type_label: string; hasCoords: boolean }[]>([]);

  // ── Live counts from the backend (start at 0, populated on init) ────────
  readonly servicesCount = signal(0);
  readonly activeServices = signal(0); // == servicesCount until we add a flag
  readonly totalBeds = signal(0);
  readonly occupiedBeds = signal(0);

  readonly freeBeds = computed(() => this.totalBeds() - this.occupiedBeds());
  readonly occupancyPct = computed(() => {
    const t = this.totalBeds();
    return t > 0 ? Math.round((this.occupiedBeds() / t) * 100) : 0;
  });

  readonly criticalCount = signal(0);

  // Mocked placeholders for areas not yet wired to a backend.
  readonly totalAlerts    = 12;
  readonly criticalAlerts = 4;
  readonly totalUsers     = signal(0);
  readonly activeUsers    = signal(0);
  readonly stockItems     = signal(0);
  readonly stockLow       = signal(0);

  // ── KPI strip (computed so it tracks the live signals) ──────────────────
  readonly hospitalKpis = computed<HospitalKpi[]>(() => [
    {
      label: 'Services', value: this.servicesCount(),
      sub: `${this.activeServices()} actifs`, icon: 'local_hospital',
      gradient: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
    },
    {
      label: 'Lits totaux', value: this.totalBeds(),
      sub: `${this.occupiedBeds()} occupés · ${this.occupancyPct()}%`, icon: 'bed',
      gradient: 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)',
    },
    {
      label: 'Alertes', value: this.totalAlerts,
      sub: `${this.criticalAlerts} critiques`, icon: 'notifications_active',
      gradient: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)',
    },
    {
      label: 'Utilisateurs', value: this.totalUsers(),
      sub: `${this.activeUsers()} actifs`, icon: 'group',
      gradient: 'linear-gradient(135deg, #8E24AA 0%, #5E35B1 100%)',
    },
    {
      label: 'DCI Pharmacie', value: this.stockItems(),
      sub: `${this.stockLow()} stratégiques`, icon: 'medication',
      gradient: 'linear-gradient(135deg, #43A047 0%, #2E7D32 100%)',
    },
  ]);

  ngOnInit(): void {
    this.cfg.listServices().subscribe({
      next: r => {
        this.servicesCount.set(r.total);
        this.activeServices.set(r.total);
      },
      error: () => {/* leave at 0 */},
    });

    this.cfg.listBeds(1000).subscribe({
      next: r => {
        this.totalBeds.set(r.total);
        this.occupiedBeds.set(r.data.filter(b => b.status === 'occupied').length);
      },
      error: () => {/* leave at 0 */},
    });

    // Load services with geo-config status
    this.http.get<any>(`${environment.baseUrl}/clinical-core/services`, {
      params: { per_page: '200' }
    }).subscribe({
      next: (res) => {
        const data = res.data ?? res ?? [];
        const svcs = (Array.isArray(data) ? data : []).map((s: any) => ({
          id: s.id,
          name: s.name,
          type_label: s.type?.label ?? s.service_type_label ?? '',
          hasCoords: s.latitude != null && s.longitude != null,
        }));
        this.configuredServices.set(svcs);
      },
      error: () => {},
    });

    // Load real user + pharmacy counts
    this.http.get<any>(`${environment.baseUrl}/admin/dashboard/stats`).subscribe({
      next: (res) => {
        this.totalUsers.set(res.users?.total ?? 0);
        this.activeUsers.set(res.users?.active ?? 0);
        this.stockItems.set(res.pharmacy?.dci_total ?? 0);
        this.stockLow.set(res.pharmacy?.dci_strategique ?? 0);
      },
      error: () => { /* leave at 0 */ },
    });
  }

  // ── Chart card toggle: 10-day history vs today ─────────────────────────
  chartView: 'history' | 'today' = 'history';
  setChartView(v: 'history' | 'today'): void { this.chartView = v; }

  // Placeholder until admissions/radiology/labo endpoints are wired.
  todaysStats: Stat[] = [
    { label: 'Admissions',          value: 12, icon: 'person_add',      cls: 'admissions' },
    { label: 'Patients en attente', value: 8, icon: 'hourglass_empty', cls: 'waiting' },
    { label: 'Radiologies du jour', value: 24, icon: 'biotech',         cls: 'radiology' },
    { label: 'Résultats labo',      value: 41, icon: 'science',         cls: 'labo' },
  ];

  chartData = signal<ChartPoint[]>(Array.from({ length: 10 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (9 - i));
    return {
      date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      admissions: Math.floor(Math.random() * 20) + 5,
      radiologie: Math.floor(Math.random() * 30) + 10,
      labo: Math.floor(Math.random() * 40) + 15,
    };
  }));

  maxVal = computed(() => {
    const data = this.chartData();
    const allValues = data.flatMap(p => [p.admissions, p.radiologie, p.labo]);
    return Math.max(1, ...allValues);
  });

  barHeight(val: number): number {
    return (val / this.maxVal()) * 80;
  }

  // ── Header date ─────────────────────────────────────────────────────────
  readonly today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });
}
