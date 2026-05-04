import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { PatientStore } from './data/patient-store';
import { AdmissionRequestService } from '../../core/services/admission-request.service';
import { ETAT_SORTIE_META } from './models/patient.model';

interface KpiCard {
  label: string; value: number | string; sub: string; icon: string; gradient: string;
}

@Component({
  selector: 'app-bde-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bde-dashboard.component.html',
  styleUrl: './bde-dashboard.component.scss',
})
export class BdeDashboardComponent {
  private store = inject(PatientStore);
  private adm = inject(AdmissionRequestService);

  readonly today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  // ── Filters ──
  chartView = signal<'Quotidien' | 'Mensuel'>('Quotidien');
  setChartView(v: 'Quotidien' | 'Mensuel') { this.chartView.set(v); }

  // ── Data ──
  readonly patientCount = computed(() => this.store.patients().length);
  readonly dossierCount = computed(() => this.store.dossiers().length);
  readonly genres = this.store.genreCounts;
  readonly countByEtat = this.store.countByEtat;
  readonly daily = this.store.admissionsLastDays;
  readonly monthly = this.store.admissionsByMonth;
  readonly thisMonth = this.store.thisMonthBreakdown;
  readonly thisMonthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  readonly thisMonthRows = computed(() => this.thisMonth().rows);
  readonly thisMonthMaxCount = computed(() => Math.max(1, ...this.thisMonth().rows.map(r => r.count)));

  readonly admissionsEnAttente = computed(() => this.adm.pending().length);
  readonly admissionsEnCours    = computed(() => this.countByEtat()['EN_COURS']);

  // KPI strip — exact metric set per the BDE spec:
  // Admission · Garde malade · Permission de sortie · Évasion
  readonly admissionsCount = computed(() => {
    let n = 0; for (const d of this.store.dossiers()) n += d.parcours.length; return n;
  });
  readonly gardeMaladeCount = computed(() =>
    this.store.patients().filter(p => !!(p.accompagnant && p.accompagnant.nom)).length
  );
  readonly permissionSortieCount = computed(() => 0); // not modelled — placeholder
  readonly evasionCount = computed(() => this.countByEtat()['EVASION'] ?? 0);

  // KPI subtitles use sentence case to match the rest of the dashboard copy.
  readonly kpis = computed<KpiCard[]>(() => [
    { label: 'Admission', value: this.admissionsCount(), sub: `${this.dossierCount()} dossiers ouverts`,
      icon: 'how_to_reg', gradient: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)' },
    { label: 'Garde malade', value: this.gardeMaladeCount(), sub: 'avec accompagnant déclaré',
      icon: 'group', gradient: 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)' },
    { label: 'Permission de sortie', value: this.permissionSortieCount(), sub: 'en cours',
      icon: 'event_available', gradient: 'linear-gradient(135deg, #FB8C00 0%, #EF6C00 100%)' },
    { label: 'Évasion', value: this.evasionCount(), sub: 'depuis l\'ouverture',
      icon: 'directions_run', gradient: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)' },
  ]);

  private sortiesToday(): number {
    const today = new Date().toISOString().slice(0,10);
    let n = 0;
    for (const d of this.store.dossiers()) {
      for (const a of d.parcours) {
        if (a.dateSortie === today) n++;
      }
    }
    return n;
  }

  private genrePctLabel(): string {
    const g = this.genres();
    if (g.total === 0) return '—';
    const pctM = Math.round((g.M / g.total) * 100);
    return `${pctM}% / ${100 - pctM}%`;
  }

  // ── Chart helpers ──
  readonly currentChart = computed(() =>
    this.chartView() === 'Quotidien'
      ? this.daily().map(b => ({ label: b.label, count: b.count }))
      : this.monthly().map(b => ({ label: b.label, count: b.count }))
  );

  readonly chartMax = computed(() => Math.max(1, ...this.currentChart().map(p => p.count)));

  barHeight(count: number): number {
    return (count / this.chartMax()) * 140;
  }

  // ── Line/area chart geometry (SVG) ──
  readonly chartViewBoxW = 600;
  readonly chartViewBoxH = 160;
  private readonly chartPadX = 30;
  private readonly chartPadY = 12;

  readonly chartPoints = computed(() => {
    const data = this.currentChart();
    if (data.length === 0) return [] as { x: number; y: number; cx: number; cy: number; count: number; label: string }[];
    const max = this.chartMax();
    const usableW = this.chartViewBoxW - this.chartPadX * 2;
    const usableH = this.chartViewBoxH - this.chartPadY * 2;
    const stepX = data.length === 1 ? 0 : usableW / (data.length - 1);
    return data.map((p, i) => {
      const x = this.chartPadX + stepX * i;
      const y = this.chartPadY + usableH * (1 - p.count / max);
      return { x, y, cx: x, cy: y, count: p.count, label: p.label };
    });
  });

  readonly chartLinePath = computed(() => {
    const pts = this.chartPoints();
    if (pts.length === 0) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  });

  readonly chartAreaPath = computed(() => {
    const pts = this.chartPoints();
    if (pts.length === 0) return '';
    const baseY = this.chartViewBoxH - this.chartPadY;
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${line} L ${last.x.toFixed(1)} ${baseY} L ${first.x.toFixed(1)} ${baseY} Z`;
  });

  // ── Genre donut (CSS conic-gradient) ──
  readonly donutBg = computed(() => {
    const g = this.genres();
    if (g.total === 0) return 'conic-gradient(#e2e8f0 0 100%)';
    const pct = (g.M / g.total) * 100;
    return `conic-gradient(#1E88E5 0 ${pct}%, #EC407A ${pct}% 100%)`;
  });

  // ── État de sortie tiles (exact spec list) ──
  readonly sortieTiles = computed(() => {
    const counts = this.countByEtat();
    const decesMeta = ETAT_SORTIE_META['DECES'];
    const transfertMeta = ETAT_SORTIE_META['TRANSFERT'];
    return [
      { label: 'Liste des malades admis',         icon: 'hotel',             color: '#1E88E5',
        count: this.admissionsEnCours(),          link: ['/bde/admis'],                   testId: 'tile-admis' },
      { label: 'Malades évacués',                 icon: transfertMeta.icon,  color: transfertMeta.color,
        count: counts['TRANSFERT'],               link: ['/bde/sorties', 'transfert'],     testId: 'tile-evacues' },
      { label: 'Malades accidents',               icon: 'medical_services',  color: '#FB8C00',
        count: 0,                                  link: ['/bde/listes', 'accidents'],      testId: 'tile-accidents' },
      { label: 'Victimes d’événements',           icon: 'campaign',          color: '#D81B60',
        count: 0,                                  link: ['/bde/listes', 'evenements'],     testId: 'tile-evenements' },
      { label: 'Liste des naissances',            icon: 'child_friendly',    color: '#26A69A',
        count: 0,                                  link: ['/bde/listes', 'naissances'],     testId: 'tile-naissances' },
      { label: 'Liste des malades décédés',       icon: decesMeta.icon,      color: decesMeta.color,
        count: counts['DECES'],                   link: ['/bde/sorties', 'deces'],         testId: 'tile-deces' },
      { label: 'Entrants hôpital jour',           icon: 'login',             color: '#43A047',
        count: this.todayAdmissions(),             link: ['/bde/listes', 'entrants-jour'],  testId: 'tile-entrants-jour' },
      { label: 'Effectif journalier',             icon: 'group',             color: '#5E35B1',
        count: this.admissionsEnCours(),           link: ['/bde/listes', 'effectif'],       testId: 'tile-effectif' },
      { label: 'Liste séjours d’un malade',       icon: 'history',           color: '#00ACC1',
        count: this.patientCount(),                link: ['/bde/listes', 'sejours'],        testId: 'tile-sejours' },
      { label: 'Malades ayant dépassé date max',  icon: 'schedule',          color: '#E53935',
        count: 0,                                  link: ['/bde/listes', 'depassement'],    testId: 'tile-depassement' },
      { label: 'Liste des gardes malades',        icon: 'shield',            color: '#7E57C2',
        count: this.gardeMaladeCount(),            link: ['/bde/listes', 'gardes-malades'], testId: 'tile-gardes-malades' },
      { label: 'Liste des lits libres',           icon: 'bed',               color: '#039BE5',
        count: 0,                                  link: ['/bde/listes', 'lits-libres'],    testId: 'tile-lits-libres' },
    ];
  });

  // Today's admissions (createdAt is a UNIX timestamp in ms)
  private readonly todayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
  private readonly todayEnd = this.todayStart + 86_400_000;
  readonly todayAdmissions = computed(() =>
    this.store.patients().filter(p =>
      typeof p.createdAt === 'number' && p.createdAt >= this.todayStart && p.createdAt < this.todayEnd
    ).length
  );

}
