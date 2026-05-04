import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';

const SORTIE_LABELS: Record<string, { label: string; icon: string; help: string }> = {
  'naissances':       { label: 'Liste des naissances',          icon: 'child_friendly',
                        help: 'Registre des naissances enregistrées dans l’établissement.' },
  'accidents':        { label: 'Malades accidents',              icon: 'medical_services',
                        help: 'Patients admis suite à un accident (route, travail, domestique).' },
  'evenements':       { label: 'Victimes d’événements',          icon: 'campaign',
                        help: 'Victimes d’événements collectifs ou catastrophes.' },
  'entrants-jour':    { label: 'Entrants hôpital jour',          icon: 'login',
                        help: 'Patients entrés à l’hôpital aujourd’hui (24 h glissantes).' },
  'effectif':         { label: 'Effectif journalier',            icon: 'group',
                        help: 'Effectif total des patients hospitalisés à la date du jour.' },
  'sejours':          { label: 'Liste séjours d’un malade',      icon: 'history',
                        help: 'Historique des séjours hospitaliers d’un patient.' },
  'depassement':      { label: 'Malades ayant dépassé date max', icon: 'schedule',
                        help: 'Patients dont la durée de séjour a dépassé la date maximale prévue.' },
  'gardes-malades':   { label: 'Liste des gardes malades',       icon: 'shield',
                        help: 'Patients accompagnés d’une garde malade pendant l’hospitalisation.' },
  'lits-libres':      { label: 'Liste des lits libres',          icon: 'bed',
                        help: 'État des lits disponibles, par service et par chambre.' },
};

@Component({
  selector: 'app-sortie-stub',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stub-wrap" data-testid="sortie-stub">
      <a class="back" routerLink="/bde/dashboard"><mat-icon>arrow_back</mat-icon> Retour au tableau de bord</a>
      <div class="stub-card">
        <div class="stub-icon"><mat-icon>{{ meta().icon }}</mat-icon></div>
        <h1>{{ meta().label }}</h1>
        <p class="help">{{ meta().help }}</p>
        <div class="badge"><mat-icon>build_circle</mat-icon> Module en cours d’implémentation</div>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; padding: 24px; }
    .back { display:inline-flex; align-items:center; gap:6px; color:#475569; text-decoration:none;
            font-weight:600; margin-bottom: 16px; }
    .back mat-icon { font-size:18px; width:18px; height:18px; }
    .stub-card { background:#fff; border:1px solid #E2E8F0; border-radius:12px; padding:48px; text-align:center;
                 box-shadow: 0 1px 2px rgba(15,23,42,.04); max-width:640px; margin:0 auto; }
    .stub-icon { width:72px; height:72px; border-radius:50%; background:#E0F7FA; color:#00BCD4;
                 display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
    .stub-icon mat-icon { font-size:36px; width:36px; height:36px; }
    h1 { margin:0 0 8px; font-size:22px; font-weight:700; color:#0F172A; }
    .help { color:#64748B; margin:0 0 20px; }
    .badge { display:inline-flex; align-items:center; gap:6px; background:#FFF8E1; color:#B45309;
             padding:6px 12px; border-radius:999px; font-weight:600; font-size:13px; }
    .badge mat-icon { font-size:18px; width:18px; height:18px; }
  `],
})
export class SortieStubComponent {
  private route = inject(ActivatedRoute);
  private slug = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  readonly meta = computed(() => {
    const k = this.slug().get('slug') || '';
    return SORTIE_LABELS[k] ?? { label: 'Liste indisponible', icon: 'help', help: 'Cette liste n’existe pas.' };
  });
}
