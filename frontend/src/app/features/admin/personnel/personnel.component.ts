import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PersonnelService } from './personnel.service';
import {
  PersonnelInput,
  PersonnelRow,
  PosteRef,
  RoleRef,
  ServiceRef,
  UserRow,
} from './personnel.models';

type EditingPersonnel = PersonnelInput & { id?: number };
type EditingPoste = { id?: number; label: string; label_ar?: string };
type CredentialDraft = {
  userId: number;
  username: string;
  password: string;
  role_ids: number[];
};

@Component({
  selector: 'app-personnel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTabsModule, MatIconModule, MatTooltipModule],
  templateUrl: './personnel.component.html',
  styleUrl: './personnel.component.scss',
})
export class PersonnelComponent implements OnInit {
  private readonly api = inject(PersonnelService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Column definitions per tab — matches the spec verbatim.
  readonly personnelCols = ['matricule', 'nom', 'prenom', 'laqab', 'ism', 'poste',
    'consultation', 'service', 'actions'];
  readonly utilisateursCols = ['username', 'password', 'groupe', 'nomPrenom', 'online', 'actions'];
  readonly gradesCols = ['poste', 'posteAr', 'actions'];

  // Tab state — query-param-driven so /admin/utilisateurs can deep-link.
  selectedTab = signal(0);

  // ── Reference data ────────────────────────────────────────────────────
  postes = signal<PosteRef[]>([]);
  services = signal<ServiceRef[]>([]);
  roles = signal<RoleRef[]>([]);

  // ── Tab 0 — Personnel ────────────────────────────────────────────────
  personnel = signal<PersonnelRow[]>([]);
  personnelSearch = '';
  loadingPersonnel = signal(false);
  editingPersonnel = signal<EditingPersonnel | null>(null);

  // ── Tab 1 — Utilisateurs ─────────────────────────────────────────────
  users = signal<UserRow[]>([]);
  userSearch = '';
  loadingUsers = signal(false);
  credentialDraft = signal<CredentialDraft | null>(null);

  // ── Tab 2 — Postes ────────────────────────────────────────────────────
  loadingPostes = signal(false);
  editingPoste = signal<EditingPoste | null>(null);

  // ── Banners ───────────────────────────────────────────────────────────
  errorMessage = signal('');
  successMessage = signal('');

  ngOnInit(): void {
    // Deep-link priority: ?tab=N query param > route data.defaultTab > 0.
    const queryTab = this.route.snapshot.queryParamMap.get('tab');
    const dataTab = this.route.snapshot.data['defaultTab'];
    const tab = Number(queryTab ?? dataTab ?? 0);
    if ([0, 1, 2].includes(tab)) this.selectedTab.set(tab);

    // Reference data is small — load once.
    this.api.listPostes().subscribe(p => this.postes.set(p.data));
    this.api.listServices().subscribe(s => this.services.set(s));
    this.api.listRoles().subscribe(r => this.roles.set(r));

    this.refreshPersonnel();
    this.refreshUsers();
  }

  onTabChange(idx: number): void {
    this.selectedTab.set(idx);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: idx },
      queryParamsHandling: 'merge',
    });
  }

  // ── Tab 0 — Personnel CRUD ────────────────────────────────────────────
  refreshPersonnel(): void {
    this.loadingPersonnel.set(true);
    this.api.listPersonnel(this.personnelSearch).subscribe({
      next: r => { this.personnel.set(r.data); this.loadingPersonnel.set(false); },
      error: () => this.loadingPersonnel.set(false),
    });
  }
  startCreatePersonnel(): void {
    this.editingPersonnel.set({
      matricule: '', name: '', first_name: '', name_ar: '', first_name_ar: '',
      poste_id: null, service_id: null, is_consultant: false,
    });
  }
  startEditPersonnel(p: PersonnelRow): void {
    this.editingPersonnel.set({
      id: p.id,
      matricule: p.matricule ?? '', name: p.name ?? '', first_name: p.first_name ?? '',
      name_ar: p.name_ar ?? '', first_name_ar: p.first_name_ar ?? '',
      poste_id: p.poste_id, service_id: p.service_id,
      is_consultant: p.is_consultant,
    });
  }
  cancelEditPersonnel(): void { this.editingPersonnel.set(null); }
  savePersonnel(): void {
    const draft = this.editingPersonnel();
    if (!draft) return;
    const payload: PersonnelInput = { ...draft };
    delete (payload as any).id;
    const op$ = draft.id
      ? this.api.updatePersonnel(draft.id, payload)
      : this.api.createPersonnel(payload);
    op$.subscribe({
      next: () => {
        this.editingPersonnel.set(null);
        this.flash(`Personnel ${draft.id ? 'modifié' : 'ajouté'}.`);
        this.refreshPersonnel();
      },
      error: err => this.bubbleError(err),
    });
  }
  deletePersonnel(p: PersonnelRow): void {
    if (!confirm(`Supprimer ${this.fullName(p)} ?`)) return;
    this.api.deletePersonnel(p.id).subscribe({
      next: () => { this.flash('Personnel supprimé.'); this.refreshPersonnel(); this.refreshUsers(); },
      error: err => this.bubbleError(err),
    });
  }

  // ── Tab 1 — Utilisateurs CRUD ─────────────────────────────────────────
  refreshUsers(): void {
    this.loadingUsers.set(true);
    this.api.listUsers(this.userSearch).subscribe({
      next: r => { this.users.set(r.data); this.loadingUsers.set(false); },
      error: () => this.loadingUsers.set(false),
    });
  }
  /** Open the credentials drawer for an existing personnel row (promote). */
  promoteToUser(p: PersonnelRow): void {
    this.credentialDraft.set({
      userId: p.id,
      username: p.username ?? this.suggestUsername(p),
      password: '',
      role_ids: (p.roles ?? []).map(r => r.id),
    });
  }
  startEditCredentials(u: UserRow): void {
    this.credentialDraft.set({
      userId: u.id,
      username: u.username,
      password: '',
      role_ids: (u.roles ?? []).map(r => r.id),
    });
  }
  cancelCredentials(): void { this.credentialDraft.set(null); }
  saveCredentials(): void {
    const d = this.credentialDraft();
    if (!d || !d.username || d.password.length < 8) {
      this.errorMessage.set('Nom d\'utilisateur requis et mot de passe d\'au moins 8 caractères.');
      return;
    }
    this.api.setCredentials(d.userId, {
      username: d.username, password: d.password, role_ids: d.role_ids,
    }).subscribe({
      next: () => {
        this.credentialDraft.set(null);
        this.flash('Identifiants enregistrés.');
        this.refreshUsers();
        this.refreshPersonnel();
      },
      error: err => this.bubbleError(err),
    });
  }
  toggleActive(u: UserRow): void {
    this.api.setActive(u.id, !u.is_active).subscribe({
      next: () => { this.flash(`Compte ${!u.is_active ? 'activé' : 'désactivé'}.`); this.refreshUsers(); },
      error: err => this.bubbleError(err),
    });
  }
  revokeCredentials(u: UserRow): void {
    if (!confirm(`Révoquer l'accès de "${u.username}" ?`)) return;
    this.api.revokeCredentials(u.id).subscribe({
      next: () => { this.flash('Accès révoqué.'); this.refreshUsers(); this.refreshPersonnel(); },
      error: err => this.bubbleError(err),
    });
  }
  toggleRoleInDraft(roleId: number): void {
    this.credentialDraft.update(d => {
      if (!d) return d;
      const set = new Set(d.role_ids);
      set.has(roleId) ? set.delete(roleId) : set.add(roleId);
      return { ...d, role_ids: [...set] };
    });
  }
  isRoleInDraft(roleId: number): boolean {
    return this.credentialDraft()?.role_ids.includes(roleId) ?? false;
  }

  // ── Patch helpers (Angular templates can't use arrow functions, so we
  //    expose typed setters instead of inline lambdas).
  patchPersonnel<K extends keyof EditingPersonnel>(key: K, value: EditingPersonnel[K]): void {
    this.editingPersonnel.update(d => d ? { ...d, [key]: value } : d);
  }
  patchCredential<K extends keyof CredentialDraft>(key: K, value: CredentialDraft[K]): void {
    this.credentialDraft.update(d => d ? { ...d, [key]: value } : d);
  }
  patchPoste<K extends keyof EditingPoste>(key: K, value: EditingPoste[K]): void {
    this.editingPoste.update(d => d ? { ...d, [key]: value } : d);
  }

  // ── Tab 2 — Postes CRUD ───────────────────────────────────────────────
  startCreatePoste(): void { this.editingPoste.set({ label: '', label_ar: '' }); }
  startEditPoste(p: PosteRef): void { this.editingPoste.set({ id: p.id, label: p.label, label_ar: p.label_ar ?? '' }); }
  cancelEditPoste(): void { this.editingPoste.set(null); }
  savePoste(): void {
    const d = this.editingPoste();
    if (!d || !d.label.trim()) return;
    const op$ = d.id
      ? this.api.updatePoste(d.id, d.label.trim(), d.label_ar?.trim() || undefined)
      : this.api.createPoste(d.label.trim(), d.label_ar?.trim() || undefined);
    op$.subscribe({
      next: () => {
        this.editingPoste.set(null);
        this.flash(`Poste ${d.id ? 'modifié' : 'ajouté'}.`);
        this.api.listPostes().subscribe(p => this.postes.set(p.data));
      },
      error: err => this.bubbleError(err),
    });
  }
  deletePoste(p: PosteRef): void {
    if (!confirm(`Supprimer le poste "${p.label}" ?`)) return;
    this.api.deletePoste(p.id).subscribe({
      next: () => {
        this.flash('Poste supprimé.');
        this.api.listPostes().subscribe(pp => this.postes.set(pp.data));
        this.refreshPersonnel();
      },
      error: err => this.bubbleError(err),
    });
  }

  // ── Display helpers ───────────────────────────────────────────────────
  posteLabel(id: number | null | undefined): string {
    if (id == null) return '—';
    return this.postes().find(p => p.id === id)?.label ?? '—';
  }
  serviceLabel(id: number | null | undefined): string {
    if (id == null) return '—';
    return this.services().find(s => s.id === id)?.name ?? '—';
  }
  fullName(p: PersonnelRow): string {
    return [p.name, p.first_name].filter(Boolean).join(' ') || '(sans nom)';
  }
  rolesLabel(roles?: RoleRef[]): string {
    if (!roles?.length) return '—';
    return roles.map(r => r.role).join(', ');
  }
  isOnline(u: UserRow): boolean {
    return u.online === 1 || u.online === true;
  }
  /** Suggest a username from the personnel record (first letter of name + first_name, lowercased). */
  private suggestUsername(p: PersonnelRow): string {
    const a = (p.first_name ?? '').trim().toLowerCase();
    const b = (p.name ?? '').trim().toLowerCase();
    if (!a && !b) return '';
    const slug = (a[0] ?? '') + b.replace(/\s+/g, '');
    return slug.replace(/[^a-z0-9._-]/g, '');
  }

  // ── Banner helpers ────────────────────────────────────────────────────
  private flash(msg: string): void {
    this.successMessage.set(msg);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 2500);
  }
  private bubbleError(err: any): void {
    const errs = err?.error?.errors;
    if (errs) {
      this.errorMessage.set(Object.values(errs).flat().join(' '));
    } else {
      this.errorMessage.set(err?.error?.message ?? 'Une erreur est survenue.');
    }
    this.successMessage.set('');
  }
}
