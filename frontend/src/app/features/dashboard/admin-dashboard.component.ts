import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CampusMapComponent } from '../carte/campus-map.component';
import { ConfigurationService } from '../admin/configuration/configuration.service';

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
  readonly totalAlerts    = 0;
  readonly criticalAlerts = 0;
  readonly totalUsers     = 0;
  readonly activeUsers    = 0;
  readonly stockItems     = 0;
  readonly stockLow       = 0;

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
      label: 'Utilisateurs', value: this.totalUsers,
      sub: `${this.activeUsers} en ligne`, icon: 'group',
      gradient: 'linear-gradient(135deg, #8E24AA 0%, #5E35B1 100%)',
    },
    {
      label: 'Stock pharmacie', value: this.stockItems,
      sub: `${this.stockLow} en rupture`, icon: 'medication',
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
  }

  // ── Chart card toggle: 10-day history vs today ─────────────────────────
  chartView: 'history' | 'today' = 'history';
  setChartView(v: 'history' | 'today'): void { this.chartView = v; }

  // Placeholder until admissions/radiology/labo endpoints are wired.
  todaysStats: Stat[] = [
    { label: 'Admissions',          value: 0, icon: 'person_add',      cls: 'admissions' },
    { label: 'Patients en attente', value: 0, icon: 'hourglass_empty', cls: 'waiting' },
    { label: 'Radiologies du jour', value: 0, icon: 'biotech',         cls: 'radiology' },
    { label: 'Résultats labo',      value: 0, icon: 'science',         cls: 'labo' },
  ];

  chartData: ChartPoint[] = Array.from({ length: 10 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (9 - i));
    return {
      date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      admissions: 0, radiologie: 0, labo: 0,
    };
  });

  maxVal = 1;
  barHeight(val: number): number { return (val / this.maxVal) * 80; }

  // ── Header date ─────────────────────────────────────────────────────────
  readonly today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });
}
