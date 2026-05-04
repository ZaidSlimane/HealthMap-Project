import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/auth/auth.service';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
  roles: string[];
  badge?: number;
  orangeDot?: boolean;
  expanded?: boolean;
  sectionLabel?: string;
}

const ALL_NAV_ITEMS: NavItem[] = [
  // ── SUPERADMIN ──
  { sectionLabel: 'CLINIQUE', label: 'Tableau de bord', icon: 'dashboard', route: '/admin/dashboard', roles: ['superadmin'] },
  { label: 'Alertes', icon: 'notifications_active', route: '/admin/alertes', roles: ['superadmin'], badge: 3 },
  { label: 'Tableau de bord BDE', icon: 'fact_check', route: '/bde/dashboard', roles: ['superadmin', 'bde'] },
  // Doctor-owned pages (Consultations, Sympt./Triage, Ordonnances, Avis,
  // CIM-10, Rapports) were removed from the superadmin sidebar. They now
  // appear only under the MEDECIN ('consultation') role. Routes and files
  // are intentionally left in place — wiring will be revisited later.
  { label: 'Consultations', icon: 'medical_services', route: '/consultations', roles: ['consultation'] },
  { label: 'Symptômes / Triage', icon: 'monitor_heart', route: '/symptomes', roles: ['consultation'] },

  { sectionLabel: 'EXAMENS', label: 'Ordonnances', icon: 'description', route: '/ordonnances', roles: ['consultation'] },
  {
    label: 'Radiologie', icon: 'biotech', roles: ['superadmin', 'radio'], expanded: false, children: [
      { label: 'Demandes', icon: 'assignment', route: '/radiology/requests', roles: ['superadmin', 'radio'] },
      { label: 'Résultats', icon: 'article', route: '/radiology/results', roles: ['superadmin', 'radio'] },
    ]
  },
  {
    label: 'Laboratoire', icon: 'science', roles: ['superadmin', 'labo'], expanded: false, children: [
      { label: 'Réception', icon: 'inbox', route: '/labo/reception', roles: ['superadmin', 'labo'] },
      { label: 'Résultats', icon: 'article', route: '/labo/results', roles: ['superadmin', 'labo'] },
    ]
  },
  {
    label: 'Pharmacie', icon: 'medication', roles: ['superadmin'], expanded: false, children: [
      { label: 'Protocoles', icon: 'list_alt', route: '/chimio/protocoles', roles: ['superadmin'] },
      { label: 'Sessions', icon: 'schedule', route: '/chimio/sessions', roles: ['superadmin'] },
    ]
  },

  { sectionLabel: 'PLANNING', label: 'Rendez-vous', icon: 'calendar_today', route: '/appointments', roles: ['superadmin', 'radio'] },
  { label: 'Avis Externes', icon: 'forum', route: '/avis-externes', roles: ['consultation'] },
  { label: 'File d\'attente', icon: 'phone_in_talk', route: '/queue/call', roles: ['superadmin', 'radio', 'labo'] },

  { sectionLabel: 'CODAGE & STATS', label: 'Codage CIM-10', icon: 'local_hospital', route: '/diagnostics', roles: ['consultation'] },
  { label: 'Rapports', icon: 'bar_chart', route: '/rapports', roles: ['consultation'] },
  {
    label: 'Statistiques', icon: 'insert_chart', roles: ['superadmin'], expanded: false, children: [
      { label: 'Rapports', icon: 'description', route: '/admin/stats', roles: ['superadmin'] },
    ]
  },

  // ── PERSONNEL & UTILISATEURS ───────────────────────────────────────────
  // Hospital-wide staff/user configuration. "Administration → /admin/dashboard"
  // was removed: it duplicated "Tableau de bord" already in CLINIQUE.
  { sectionLabel: 'PERSONNEL & UTILISATEURS', label: 'Configuration (API)', icon: 'tune', route: '/admin/configuration', roles: ['superadmin', 'admin'] },
  { label: 'Gestion des Services', icon: 'medical_services', route: '/admin/services', roles: ['superadmin', 'admin'] },
  // Single 3-tab page (Personnel / Utilisateurs / Grades). The two old
  // separate entries collapsed into this; /admin/utilisateurs still works
  // (loads the same component on the Utilisateurs tab).
  { label: 'Personnel & Utilisateurs', icon: 'badge', route: '/admin/personnel', roles: ['superadmin'] },
  { label: 'Médecins', icon: 'people', route: '/admin/medecins', roles: ['superadmin', 'admin'] },

  // ── PARAMÉTRAGES UNITÉS ────────────────────────────────────────────────
  // Per-unit config grouped as collapsibles to keep unit-scoped settings
  // visually distinct from hospital-wide user/staff config above.
  {
    sectionLabel: 'PARAMÉTRAGES UNITÉS',
    label: 'Paramétrages Borne', icon: 'settings_input_component', roles: ['superadmin', 'admin'], expanded: false, children: [
      { label: 'Médecins de tri', icon: 'medical_services', route: '/admin/borne/medecins', roles: ['superadmin', 'admin'] },
      { label: 'Box', icon: 'meeting_room', route: '/admin/borne/box', roles: ['superadmin', 'admin'] },
      { label: 'Borne', icon: 'tablet_android', route: '/admin/borne/config', roles: ['superadmin', 'admin'] },
    ]
  },
  {
    label: 'Radiologie Config', icon: 'biotech', roles: ['superadmin', 'admin'], expanded: false, children: [
      { label: 'Configuration', icon: 'tune', route: '/admin/radiologie/config', roles: ['superadmin', 'admin'] },
    ]
  },
  {
    label: 'Laboratoire Config', icon: 'science', roles: ['superadmin', 'admin'], expanded: false, children: [
      { label: 'Configuration', icon: 'tune', route: '/admin/laboratoire/config', roles: ['superadmin', 'admin'] },
    ]
  },

  // ── SYSTÈME ────────────────────────────────────────────────────────────
  // Cross-cutting system tools (network, data import, schema migration).
  { sectionLabel: 'SYSTÈME', label: 'Réseau Hospitalier', icon: 'hub', route: '/reseau', roles: ['superadmin'] },
  { label: 'Import Patients', icon: 'upload_file', route: '/import', roles: ['superadmin'] },
  { label: 'Migration', icon: 'sync', route: '/migration', roles: ['superadmin'] },

  { sectionLabel: 'OUTILS', label: 'Plan du CHU', icon: 'account_balance', route: '/carte', roles: ['superadmin', 'bde', 'consultation'] },
  { label: 'Borne d\'accueil', icon: 'tablet_android', route: '/borne', roles: ['superadmin', 'bde'] },
  { label: 'Recherche', icon: 'search', route: '/recherche', roles: ['superadmin', 'consultation', 'radio', 'labo', 'bde'] },
  { label: 'Mon profil', icon: 'account_circle', route: '/profil', roles: ['superadmin', 'consultation', 'radio', 'labo', 'bde'] },

  // ── RADIO ──
  { sectionLabel: 'CLINIQUE', label: 'Tableau de bord', icon: 'dashboard', route: '/radiology/dashboard', roles: ['radio'] },
  { label: 'Demandes examen', icon: 'assignment', route: '/radiology/requests', roles: ['radio'] },
  { label: 'Gestion des RVD', icon: 'calendar_today', route: '/appointments', roles: ['radio'] },

  // ── LABO ──
  { sectionLabel: 'CLINIQUE', label: 'Saisie résultats', icon: 'science', route: '/labo/results', roles: ['labo'] },

  // ── CONSULTATION ──
  { sectionLabel: 'CLINIQUE', label: 'Tri', icon: 'filter_list', route: '/consultation/tri', roles: ['consultation'] },
  { label: 'Consultation', icon: 'medical_services', route: '/consultation', roles: ['consultation'] },
  { label: 'URGENCES MEDICO-CHIR.', icon: 'emergency', route: '/services/urgences', roles: ['consultation'], orangeDot: true },
  { label: 'CARDIOLOGIE', icon: 'favorite', route: '/services/cardio', roles: ['consultation'], orangeDot: true },
  { label: 'HEMODIALYSE', icon: 'water_drop', route: '/services/hemodialyse', roles: ['consultation'], orangeDot: true },
  { label: 'GYNECOLOGIE OBSTETRIQUE', icon: 'pregnant_woman', route: '/services/gyneco', roles: ['consultation'], orangeDot: true },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatTooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() collapsed = false;

  private auth = inject(AuthService);
  private router = inject(Router);

  navItems: NavItem[] = ALL_NAV_ITEMS.map(item => ({ ...item, children: item.children ? [...item.children] : undefined }));

  filteredItems = computed(() => {
    if (!this.auth.currentUser()) return [];
    const user = this.auth.currentUser()!;
    const userRoles = user.roles.map(r => r.role);

    return this.navItems.filter(item =>
      item.roles.some(requiredRole => userRoles.includes(requiredRole))
    );
  });

  currentRoute = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e: NavigationEnd) => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  isActive(item: NavItem): boolean {
    const route = this.currentRoute();
    if (item.route) return route === item.route || route.startsWith(item.route + '/');
    if (item.children) return item.children.some(c => c.route && (route === c.route || route.startsWith(c.route + '/')));
    return false;
  }

  toggleGroup(item: NavItem): void {
    item.expanded = !item.expanded;
  }

  navigate(route: string | undefined): void {
    if (route) this.router.navigate([route]);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
