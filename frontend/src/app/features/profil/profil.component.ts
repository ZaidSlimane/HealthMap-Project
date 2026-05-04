import { Component, signal, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="profil-page">
      <div class="profil-hero">
        <div class="ph-avatar">{{ initials() }}</div>
        <div class="ph-info">
          <h1 class="ph-name">{{ user()?.name ?? 'Utilisateur' }}</h1>
          <p class="ph-role">{{ roleLabel() }}</p>
          <p class="ph-username">{{ user()?.email ?? '' }}</p>
        </div>
      </div>

      <div class="profil-cards">
        @if (isDoctor()) {
          <div class="profil-card doctor-tools">
            <h3 class="pc-title">Outils Cliniques</h3>
            <div class="tools-grid">
              @for (link of doctorLinks; track link.route) {
                <button class="tool-btn" (click)="navigate(link.route)">
                  <mat-icon>{{ link.icon }}</mat-icon>
                  <span>{{ link.label }}</span>
                </button>
              }
            </div>
          </div>
        }

        <div class="profil-card">
          <h3 class="pc-title">Informations personnelles</h3>
          <div class="info-grid">
            <div class="ig-field"><label>Nom complet</label><p>{{ user()?.name ?? '—' }}</p></div>
            <div class="ig-field"><label>Identifiant</label><p>{{ user()?.email ?? '—' }}</p></div>
            <div class="ig-field"><label>Rôle</label><p>{{ roleLabel() }}</p></div>
            <div class="ig-field"><label>Service</label><p>Médecine générale</p></div>
            <div class="ig-field"><label>Email</label><p>{{ user()?.email ?? '—' }}</p></div>
            <div class="ig-field"><label>Téléphone</label><p>+213 5XX XXX XXX</p></div>
          </div>
        </div>

        <div class="profil-card">
          <h3 class="pc-title">Changer le mot de passe</h3>
          <div class="pwd-form">
            <div class="pf-field">
              <label>Mot de passe actuel</label>
              <input type="password" [(ngModel)]="currentPwd" class="pf-input" />
            </div>
            <div class="pf-field">
              <label>Nouveau mot de passe</label>
              <input type="password" [(ngModel)]="newPwd" class="pf-input" />
            </div>
            <div class="pf-field">
              <label>Confirmer</label>
              <input type="password" [(ngModel)]="confirmPwd" class="pf-input" />
            </div>
            <button class="btn-save" (click)="savePwd()"><mat-icon>lock</mat-icon> Changer le mot de passe</button>
          </div>
        </div>

        <div class="profil-card">
          <h3 class="pc-title">Préférences</h3>
          <div class="pref-row">
            <span>Langue de l'interface</span>
            <select class="pref-select"><option value="fr">Français</option><option value="ar">Arabe</option></select>
          </div>
          <div class="pref-row">
            <span>Notifications par email</span>
            <label class="toggle">
              <input type="checkbox" [checked]="notifications()" (change)="notifications.set(!notifications())" />
              <span class="toggle-track"></span>
            </label>
          </div>
          <div class="pref-row">
            <span>Mode sombre</span>
            <label class="toggle">
              <input type="checkbox" [checked]="darkMode()" (change)="darkMode.set(!darkMode())" />
              <span class="toggle-track"></span>
            </label>
          </div>
        </div>

        <div class="profil-card">
          <h3 class="pc-title">Activité récente</h3>
          <div class="activity-list">
            @for (a of activities; track a.time) {
              <div class="activity-item">
                <mat-icon class="ai-icon" [class]="'ai-' + a.type">{{ a.icon }}</mat-icon>
                <div class="ai-body">
                  <p class="ai-desc">{{ a.description }}</p>
                  <span class="ai-time">{{ a.time }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="profil-footer">
        <button class="btn-logout" (click)="logout()"><mat-icon>logout</mat-icon> Déconnexion</button>
      </div>
    </div>
  `,
  styles: [`
    .profil-page { padding: var(--space-6); max-width: 960px; }
    .profil-hero { display: flex; align-items: center; gap: var(--space-5); padding: var(--space-6); background: linear-gradient(135deg, var(--color-primary) 0%, #006064 100%); border-radius: var(--radius-xl); margin-bottom: var(--space-6); color: #fff; }
    .ph-avatar { width: 80px; height: 80px; border-radius: 50%; background: rgba(255,255,255,0.25); border: 3px solid rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; color: #fff; flex-shrink: 0; }
    .ph-name { font-size: 24px; font-weight: 700; margin: 0; }
    .ph-role { font-size: 14px; color: rgba(255,255,255,0.8); margin: 4px 0; }
    .ph-username { font-family: var(--font-mono); font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }
    .profil-cards { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); margin-bottom: var(--space-5); }
    .profil-card { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-md); }
    .doctor-tools { border-top: 4px solid var(--color-primary); }
    .tools-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
    .tool-btn { display: flex; align-items: center; gap: var(--space-3); padding: 12px; background: var(--color-background); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; transition: 0.2s; text-align: left; font-size: 13px; font-weight: 500; color: var(--color-text); mat-icon { font-size: 18px; color: var(--color-primary); } &:hover { background: var(--color-border); border-color: var(--color-primary); } }
    .pc-title { font-size: 14px; font-weight: 700; margin: 0 0 var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-border); color: var(--color-text); }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
    .ig-field { label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); display: block; margin-bottom: 4px; } p { font-size: 14px; color: var(--color-text); margin: 0; font-weight: 500; } }
    .pwd-form { display: flex; flex-direction: column; gap: var(--space-3); }
    .pf-field { display: flex; flex-direction: column; gap: var(--space-2); label { font-size: 12px; font-weight: 600; color: var(--color-text-muted); } }
    .pf-input { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px var(--space-3); font-size: 13px; background: var(--color-background); &:focus { outline: none; border-color: var(--color-primary); } }
    .btn-save { display: inline-flex; align-items: center; gap: var(--space-2); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 13px; font-weight: 600; cursor: pointer; mat-icon { font-size: 16px; } }
    .pref-row { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) 0; border-bottom: 1px solid var(--color-border); font-size: 14px; color: var(--color-text); &:last-child { border: none; } }
    .pref-select { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 6px var(--space-3); font-size: 13px; background: var(--color-background); }
    .toggle { position: relative; display: block; width: 40px; height: 22px; input { opacity: 0; width: 0; height: 0; } }
    .toggle-track { position: absolute; inset: 0; background: var(--color-border); border-radius: var(--radius-full); cursor: pointer; transition: 0.3s; &::after { content: ''; position: absolute; width: 16px; height: 16px; border-radius: 50%; background: #fff; top: 3px; left: 3px; transition: 0.3s; } }
    input:checked ~ .toggle-track { background: var(--color-primary); &::after { transform: translateX(18px); } }
    .activity-list { display: flex; flex-direction: column; gap: var(--space-3); }
    .activity-item { display: flex; align-items: flex-start; gap: var(--space-3); }
    .ai-icon { font-size: 18px; margin-top: 2px; &.ai-login { color: var(--color-primary); } &.ai-edit { color: #FF9800; } &.ai-view { color: #9C27B0; } }
    .ai-body { flex: 1; }
    .ai-desc { font-size: 13px; color: var(--color-text); margin: 0; }
    .ai-time { font-size: 11px; color: var(--color-text-muted); }
    .profil-footer { display: flex; justify-content: flex-end; }
    .btn-logout { display: inline-flex; align-items: center; gap: var(--space-2); background: transparent; border: 1px solid var(--color-urgent); color: var(--color-urgent); border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 14px; font-weight: 600; cursor: pointer; mat-icon { font-size: 18px; } &:hover { background: var(--color-urgent-bg); } }
  `]
})
export class ProfilComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  user = this.auth.currentUser;
  currentPwd = '';
  newPwd = '';
  confirmPwd = '';
  notifications = signal(true);
  darkMode = signal(false);

  readonly doctorLinks = [
    { label: 'Consultations', icon: 'medical_services', route: '/consultations' },
    { label: 'Symptômes / Triage', icon: 'monitor_heart', route: '/symptomes' },
    { label: 'Ordonnances', icon: 'description', route: '/ordonnances' },
    { label: 'Avis Externes', icon: 'forum', route: '/avis-externes' },
    { label: 'Codage CIM-10', icon: 'local_hospital', route: '/diagnostics' },
    { label: 'Rapports', icon: 'bar_chart', route: '/rapports' },
  ];

  initials = () => {
    const name = this.user()?.name ?? 'U';
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  };

  roleLabel(): string {
    const m: Record<string, string> = {
      Admin: 'Administrateur',
      superadmin: 'Super Administrateur',
      consultation: 'Médecin Consultant',
      radio: 'Radiologue',
      labo: 'Laborantin',
      bde: 'Bureau des entrées',
    };
    const role = this.auth.getUserRole();
    return m[role] ?? role ?? '—';
  }

  isDoctor = computed(() => {
    const role = this.auth.getUserRole();
    return role === 'consultation' || role === 'Admin' || role === 'superadmin';
  });

  activities = [
    { icon: 'login', type: 'login', description: 'Connexion au système', time: 'Il y a 5 min' },
    { icon: 'edit', type: 'edit', description: 'Consultation modifiée #C001', time: 'Il y a 30 min' },
    { icon: 'visibility', type: 'view', description: 'Dossier patient consulté', time: 'Il y a 1h' },
    { icon: 'print', type: 'view', description: 'Ordonnance imprimée', time: 'Hier, 14:30' },
  ];

  savePwd(): void { /* TODO */ }
  logout(): void {
    this.auth.logout();
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }
}
