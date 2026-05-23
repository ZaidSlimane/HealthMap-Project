import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/auth/auth.service';
import { UserRole } from '../../core/auth/models/user.model';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
  roles: UserRole[];
  badge?: number;
  orangeDot?: boolean;
  expanded?: boolean;
  sectionLabel?: string;
}

const ALL_NAV_ITEMS: NavItem[] = [
  // ── SUPERADMIN ──
  { sectionLabel: 'CLINIQUE', label: 'Tableau de bord', icon: 'dashboard', route: '/admin/dashboard', roles: ['superadmin', 'Admin'] },
  { label: 'Alertes', icon: 'notifications_active', route: '/admin/alertes', roles: ['superadmin'], badge: 3 },
  { label: 'Tableau de bord BDE', icon: 'fact_check', route: '/bde/dashboard', roles: ['superadmin', 'bde'] },
  // Doctor-owned pages moved to Doctor sidebar only.

  { sectionLabel: 'EXAMENS', label: 'Radiologie', icon: 'biotech', roles: ['superadmin', 'radiotech'], expanded: false, children: [
      { label: 'Demandes', icon: 'assignment', route: '/radiology/requests', roles: ['superadmin', 'radiotech'] },
      { label: 'Résultats', icon: 'article', route: '/radiology/results', roles: ['superadmin', 'radiotech'] },
    ]
  },
  {
    label: 'Laboratoire', icon: 'science', roles: ['superadmin', 'labtech'], expanded: false, children: [
      { label: 'Réception', icon: 'inbox', route: '/labo/reception', roles: ['superadmin', 'labtech'] },
      { label: 'Résultats', icon: 'article', route: '/labo/results', roles: ['superadmin', 'labtech'] },
    ]
  },
  {
    label: 'Pharmacie', icon: 'medication', roles: ['superadmin'], expanded: false, children: [
      { label: 'Protocoles', icon: 'list_alt', route: '/chimio/protocoles', roles: ['superadmin'] },
      { label: 'Sessions', icon: 'schedule', route: '/chimio/sessions', roles: ['superadmin'] },
    ]
  },

  { sectionLabel: 'PLANNING', label: 'Rendez-vous', icon: 'calendar_today', route: '/appointments', roles: ['superadmin', 'radiotech'] },
  { label: 'File d\'attente', icon: 'phone_in_talk', route: '/queue/call', roles: ['superadmin', 'radiotech', 'labtech'] },

  {
    sectionLabel: 'STATISTIQUES',
    label: 'Statistiques', icon: 'insert_chart', roles: ['superadmin'], expanded: false, children: [
      { label: 'Rapports', icon: 'description', route: '/admin/stats', roles: ['superadmin'] },
    ]
  },

  // ── PERSONNEL & UTILISATEURS ───────────────────────────────────────────
  { sectionLabel: 'PERSONNEL & UTILISATEURS', label: 'Personnel & Utilisateurs', icon: 'badge', route: '/admin/personnel', roles: ['superadmin', 'Admin'] },
  { label: 'Configuration (API)', icon: 'tune', route: '/admin/configuration', roles: ['superadmin', 'Admin'] },
  { label: 'Gestion des Services', icon: 'medical_services', route: '/admin/services', roles: ['superadmin', 'Admin'] },
  { label: 'Médecins', icon: 'people', route: '/admin/medecins', roles: ['superadmin', 'Admin'] },

  // ── PARAMÉTRAGES UNITÉS ────────────────────────────────────────────────
  // Per-unit config grouped as collapsibles to keep unit-scoped settings
  // visually distinct from hospital-wide user/staff config above.
  {
    sectionLabel: 'PARAMÉTRAGES UNITÉS',
    label: 'Paramétrages Borne', icon: 'settings_input_component', roles: ['superadmin', 'Admin'], expanded: false, children: [
      { label: 'Médecins de tri', icon: 'medical_services', route: '/admin/borne/medecins', roles: ['superadmin', 'Admin'] },
      { label: 'Box', icon: 'meeting_room', route: '/admin/borne/box', roles: ['superadmin', 'Admin'] },
      { label: 'Borne', icon: 'tablet_android', route: '/admin/borne/config', roles: ['superadmin', 'Admin'] },
    ]
  },
  {
    label: 'Radiologie Config', icon: 'biotech', roles: ['superadmin', 'Admin'], expanded: false, children: [
      { label: 'Configuration', icon: 'tune', route: '/admin/radiologie/config', roles: ['superadmin', 'Admin'] },
    ]
  },
  {
    label: 'Laboratoire Config', icon: 'science', roles: ['superadmin', 'Admin'], expanded: false, children: [
      { label: 'Configuration', icon: 'tune', route: '/admin/laboratoire/config', roles: ['superadmin', 'Admin'] },
    ]
  },

  // ── SYSTÈME ────────────────────────────────────────────────────────────
  // Cross-cutting system tools (network, data import, schema migration).
  { sectionLabel: 'SYSTÈME', label: 'Réseau Hospitalier', icon: 'hub', route: '/reseau', roles: ['superadmin'] },
  { label: 'Import Patients', icon: 'upload_file', route: '/import', roles: ['superadmin'] },
  { label: 'Migration', icon: 'sync', route: '/migration', roles: ['superadmin'] },

  { sectionLabel: 'OUTILS', label: 'Plan du CHU', icon: 'account_balance', route: '/carte', roles: ['superadmin', 'bde', 'consultation'] },
  { label: 'Borne d\'accueil', icon: 'tablet_android', route: '/borne', roles: ['superadmin', 'bde'] },
  { label: 'Recherche', icon: 'search', route: '/recherche', roles: ['superadmin', 'consultation', 'radiotech', 'labtech', 'bde'] },
  { label: 'Mon profil', icon: 'account_circle', route: '/profil', roles: ['superadmin', 'consultation', 'radiotech', 'labtech', 'bde'] },

  // ── RADIO ──
  { sectionLabel: 'CLINIQUE', label: 'Tableau de bord', icon: 'dashboard', route: '/radiology/dashboard', roles: ['radiotech'] },
  { label: 'Demandes examen', icon: 'assignment', route: '/radiology/requests', roles: ['radiotech'] },
  { label: 'Gestion des RDV', icon: 'calendar_today', route: '/radiology/rdv', roles: ['radiotech'] },

  // ── LABO ──
  { sectionLabel: 'CLINIQUE', label: 'Tableau de bord', icon: 'dashboard', route: '/laboratory/dashboard', roles: ['labtech'] },
  { label: 'Worklist', icon: 'science', route: '/laboratory', roles: ['labtech'] },
  { label: 'Saisie résultats', icon: 'edit_note', route: '/labo/results', roles: ['labtech'] },

  // ── CONSULTATION ──
  // Tri/Consultation/Services moved to Doctor sidebar only.
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
    // Build the effective role list from either roles[] or role_names[]
    const userRoles: string[] = (user.roles && user.roles.length > 0)
      ? user.roles.map(r => r.role.toLowerCase())
      : (user.role_names ?? []).map(r => r.toLowerCase());

    // Admin role is a wildcard — show all nav items (mirrors roleGuard behavior)
    if (userRoles.includes('admin')) {
      return this.navItems;
    }

    // ChefService role — dedicated sidebar for service management
    if (userRoles.includes('chefservice')) {
      const chefItems: NavItem[] = [];

      chefItems.push({
        sectionLabel: 'CHEF DE SERVICE',
        label: 'Tableau de bord',
        icon: 'dashboard',
        route: '/chef/dashboard',
        roles: ['ChefService'],
      });
      chefItems.push({
        label: 'Boxes',
        icon: 'meeting_room',
        route: '/chef/boxes',
        roles: ['ChefService'],
      });
      chefItems.push({
        label: 'Médecins',
        icon: 'people',
        route: '/chef/medecins',
        roles: ['ChefService'],
      });

      chefItems.push({
        sectionLabel: 'COMPTE',
        label: 'Mon profil',
        icon: 'account_circle',
        route: '/profil',
        roles: ['ChefService'],
      });

      return chefItems;
    }

    // Doctor role — build a custom sidebar with their services
    if (userRoles.includes('doctor')) {
      const doctorItems: NavItem[] = [];

      // Section: Clinique
      // "Tri" is a triage doctor-only feature; only show it if the user
      // explicitly holds the "tri" role (or "triage").
      const hasTriRole = userRoles.some(r => r === 'tri' || r === 'triage');
      if (hasTriRole) {
        doctorItems.push({
          sectionLabel: 'CLINIQUE',
          label: 'Tri',
          icon: 'filter_list',
          route: '/consultation/tri',
          roles: ['Doctor'],
        });
      }

      // The Consultation entry takes the section label when Tri is hidden
      doctorItems.push({
        sectionLabel: hasTriRole ? undefined : 'CLINIQUE',
        label: 'Consultation',
        icon: 'medical_services',
        route: '/consultation',
        roles: ['Doctor'],
      } as NavItem);

      // Section: Services
      const services = user.services ?? [];
      if (services.length > 0) {
        doctorItems.push({
          sectionLabel: 'MES SERVICES',
          label: services[0].name,
          icon: 'local_hospital',
          route: `/services/${services[0].id}`,
          roles: ['Doctor'],
        });
        for (let i = 1; i < services.length; i++) {
          doctorItems.push({
            label: services[i].name,
            icon: 'local_hospital',
            route: `/services/${services[i].id}`,
            roles: ['Doctor'],
          });
        }
      }

      // Section: Profil
      doctorItems.push({
        sectionLabel: 'COMPTE',
        label: 'Mon profil',
        icon: 'account_circle',
        route: '/profil',
        roles: ['Doctor'],
      });

      return doctorItems;
    }

    return this.navItems.filter(item =>
      item.roles.some(requiredRole => userRoles.includes(requiredRole.toLowerCase()))
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
    const fullRoute = this.currentRoute();
    const route = fullRoute.split('?')[0];
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
