import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { PatientStore } from '../data/patient-store';
import { ETAT_SORTIE_META, EtatSortie } from '../models/patient.model';

type ModeFilter = 'ALL' | 'Admission normale' | 'Urgence' | 'Programmée';

export type ListMode = 'all' | 'admis' | 'sortie';

@Component({
  selector: 'app-patients-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patients-list.component.html',
  styleUrl: './patients-list.component.scss',
})
export class PatientsListComponent {
  private store = inject(PatientStore);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  private dataSig = toSignal(this.route.data, { requireSync: true });
  private params = toSignal(this.route.paramMap, { requireSync: true });

  readonly mode = computed<ListMode>(() => (this.dataSig()['mode'] as ListMode) ?? 'all');
  readonly etatParam = computed<EtatSortie | null>(() => {
    const raw = this.params().get('etat');
    if (!raw) return null;
    const upper = raw.toUpperCase() as EtatSortie;
    return upper in ETAT_SORTIE_META ? upper : null;
  });

  searchTerm = signal('');
  setSearch(v: string) { this.searchTerm.set(v); }

  // Filter UI (admis mode)
  showFilters = signal(false);
  readonly modeOptions: ReadonlyArray<ModeFilter> = ['ALL', 'Admission normale', 'Urgence', 'Programmée'];
  modeFilter = signal<ModeFilter>('ALL');
  toggleFilters() { this.showFilters.update(v => !v); }
  setModeFilter(v: ModeFilter) { this.modeFilter.set(v); this.page.set(1); }

  // Pagination
  pageSize = 10;
  page = signal(1);
  prevPage() { this.page.update(p => Math.max(1, p - 1)); }
  nextPage() { this.page.update(p => Math.min(this.totalPages(), p + 1)); }

  imprimerListe(): void {
    if (typeof window !== 'undefined' && typeof window.print === 'function') window.print();
  }

  readonly title = computed(() => {
    if (this.mode() === 'admis') return 'Liste des malades admis';
    if (this.mode() === 'sortie') {
      const e = this.etatParam();
      return e ? `Patients — ${ETAT_SORTIE_META[e].label}` : 'Patients par état de sortie';
    }
    return 'Liste des patients';
  });

  readonly icon = computed(() => {
    if (this.mode() === 'admis') return 'hotel';
    if (this.mode() === 'sortie') {
      const e = this.etatParam();
      return e ? ETAT_SORTIE_META[e].icon : 'logout';
    }
    return 'badge';
  });

  readonly rows = computed(() => {
    const dossiers = this.store.dossiers();
    const term = this.searchTerm().trim().toLowerCase();
    const mf = this.modeFilter();
    const out = this.store.patients()
      .map(p => {
        const d = dossiers.find(x => x.id === p.dossierId);
        const lastAdm = d?.parcours[d.parcours.length - 1];
        return { p, d, lastAdm };
      })
      .filter(r => {
        if (this.mode() === 'admis') return r.lastAdm?.etatSortie === 'EN_COURS';
        if (this.mode() === 'sortie') {
          const e = this.etatParam();
          if (!e) return true;
          return r.lastAdm?.etatSortie === e;
        }
        return true;
      })
      .filter(r => {
        if (this.mode() !== 'admis' || mf === 'ALL') return true;
        return r.lastAdm?.mode === mf;
      })
      .filter(r => {
        if (!term) return true;
        const hay = `${r.p.nomFr} ${r.p.prenomFr} ${r.p.dossierId} ${r.lastAdm?.service ?? ''}`.toLowerCase();
        return hay.includes(term);
      });
    return out;
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.rows().length / this.pageSize)));
  readonly currentPage = computed(() => Math.min(Math.max(1, this.page()), this.totalPages()));
  readonly pagedRows = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.rows().slice(start, start + this.pageSize);
  });

  // Side-donut breakdown by genre for the currently filtered set
  readonly genreBreakdown = computed(() => {
    let m = 0, f = 0;
    for (const r of this.rows()) (r.p.genre === 'M' ? m++ : f++);
    const total = m + f;
    return { m, f, total };
  });
  readonly donutBg = computed(() => {
    const g = this.genreBreakdown();
    if (g.total === 0) return 'conic-gradient(#e2e8f0 0 100%)';
    const pct = (g.m / g.total) * 100;
    return `conic-gradient(#1E88E5 0 ${pct}%, #EC407A ${pct}% 100%)`;
  });

  open(patientId: string): void {
    this.router.navigate(['/bde/dossier', patientId]);
  }

  meta = ETAT_SORTIE_META;
}
