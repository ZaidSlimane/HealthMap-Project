import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: string;
  service: string;
  active: boolean;
  lastLogin: string;
}

@Component({
  selector: 'app-compte',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="compte-page">
      <div class="compte-header">
        <div>
          <h1>Gestion des comptes utilisateurs</h1>
          <p>Création, modification et droits d'accès des utilisateurs du système</p>
        </div>
        <button class="btn-teal" (click)="showForm.set(true)"><mat-icon>person_add</mat-icon> Ajouter un compte</button>
      </div>

      @if (showForm()) {
        <div class="create-form">
          <h3>Nouveau compte utilisateur</h3>
          <div class="form-grid">
            <div class="fg"><label>Nom complet *</label><input type="text" [(ngModel)]="form.name" /></div>
            <div class="fg"><label>Identifiant *</label><input type="text" [(ngModel)]="form.username" /></div>
            <div class="fg"><label>Mot de passe *</label><input type="password" [(ngModel)]="form.password" /></div>
            <div class="fg"><label>Rôle</label>
              <select [(ngModel)]="form.role">
                <option value="consultation">Médecin consultant</option>
                <option value="radio">Radiologue</option>
                <option value="labo">Laborantin</option>
                <option value="bde">Bureau des entrées</option>
                <option value="pharmacie">Pharmacien</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
            <div class="fg"><label>Service</label><input type="text" [(ngModel)]="form.service" /></div>
          </div>
          <div class="form-actions">
            <button class="btn-cancel" (click)="showForm.set(false)">Annuler</button>
            <button class="btn-save"><mat-icon>save</mat-icon> Créer le compte</button>
          </div>
        </div>
      }

      <div class="table-card">
        <div class="tc-toolbar">
          <div class="search-wrap"><mat-icon>search</mat-icon><input [(ngModel)]="search" placeholder="Rechercher..." /></div>
          <select class="role-filter" [(ngModel)]="roleFilter">
            <option value="">Tous les rôles</option>
            <option value="superadmin">Super Admin</option>
            <option value="consultation">Médecin</option>
            <option value="radio">Radiologue</option>
            <option value="labo">Laborantin</option>
          </select>
        </div>
        <table class="data-table">
          <thead>
            <tr><th>Utilisateur</th><th>Rôle</th><th>Service</th><th>Dernière connexion</th><th>Statut</th><th>Actions</th></tr>
          </thead>
          <tbody>
            @for (u of filteredUsers(); track u.id) {
              <tr>
                <td class="td-user">
                  <div class="user-avatar">{{ initials(u) }}</div>
                  <div><strong>{{ u.name }}</strong><br /><span class="ud">{{ u.username }}</span></div>
                </td>
                <td><span class="role-badge" [class]="'r-' + u.role">{{ roleLabel(u.role) }}</span></td>
                <td>{{ u.service }}</td>
                <td class="td-login">{{ u.lastLogin }}</td>
                <td>
                  <label class="toggle">
                    <input type="checkbox" [checked]="u.active" (change)="toggleUser(u)" />
                    <span class="toggle-track"></span>
                  </label>
                </td>
                <td class="td-actions">
                  <button class="action-btn" title="Modifier"><mat-icon>edit</mat-icon></button>
                  <button class="action-btn action-pwd" title="Réinitialiser MDP"><mat-icon>lock_reset</mat-icon></button>
                  <button class="action-btn action-del" title="Supprimer" (click)="deleteUser(u.id)"><mat-icon>delete</mat-icon></button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .compte-page { padding: var(--space-6); }
    .compte-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5); h1 { font-size: 22px; font-weight: 700; margin: 0; } p { font-size: 13px; color: var(--color-text-muted); margin: 4px 0 0; } }
    .btn-teal { display: inline-flex; align-items: center; gap: var(--space-2); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 13px; font-weight: 600; cursor: pointer; mat-icon { font-size: 18px; } }
    .create-form { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-md); margin-bottom: var(--space-5); h3 { font-size: 15px; font-weight: 700; margin: 0 0 var(--space-4); } }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-4); }
    .fg { display: flex; flex-direction: column; gap: var(--space-2); label { font-size: 12px; font-weight: 600; color: var(--color-text-muted); } input, select { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px var(--space-3); font-size: 13px; background: var(--color-background); &:focus { outline: none; border-color: var(--color-primary); } } }
    .form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); }
    .btn-cancel { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 8px var(--space-4); font-size: 13px; cursor: pointer; color: var(--color-text-muted); }
    .btn-save { display: inline-flex; align-items: center; gap: var(--space-2); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); padding: 8px var(--space-5); font-size: 13px; font-weight: 600; cursor: pointer; mat-icon { font-size: 16px; } }
    .table-card { background: var(--color-surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); overflow: hidden; }
    .tc-toolbar { display: flex; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); }
    .search-wrap { display: flex; align-items: center; gap: var(--space-2); background: var(--color-background); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 6px var(--space-3); flex: 1; mat-icon { color: var(--color-text-muted); font-size: 18px; } input { border: none; background: transparent; outline: none; flex: 1; font-size: 13px; } }
    .role-filter { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 8px var(--space-3); font-size: 13px; background: var(--color-background); }
    .data-table { width: 100%; border-collapse: collapse; th { padding: var(--space-3) var(--space-4); text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); background: var(--color-background); border-bottom: 1px solid var(--color-border); } td { padding: var(--space-3) var(--space-4); font-size: 13px; border-bottom: 1px solid var(--color-border); } tr:last-child td { border-bottom: none; } }
    .td-user { display: flex; align-items: center; gap: var(--space-3); strong { font-size: 13px; } }
    .user-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary); color: #fff; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ud { font-size: 11px; color: var(--color-text-muted); font-family: var(--font-mono); }
    .role-badge { padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700; &.r-superadmin { background: rgba(156,39,176,0.1); color: #7B1FA2; } &.r-consultation { background: rgba(0,188,212,0.1); color: var(--color-primary); } &.r-radio { background: rgba(33,150,243,0.1); color: #1565C0; } &.r-labo { background: rgba(76,175,80,0.1); color: #2E7D32; } &.r-bde { background: rgba(255,152,0,0.1); color: #E65100; } }
    .td-login { font-size: 12px; color: var(--color-text-muted); }
    .toggle { position: relative; display: block; width: 40px; height: 22px; input { opacity: 0; width: 0; height: 0; } }
    .toggle-track { position: absolute; inset: 0; background: var(--color-border); border-radius: var(--radius-full); cursor: pointer; transition: 0.3s; &::after { content: ''; position: absolute; width: 16px; height: 16px; border-radius: 50%; background: #fff; top: 3px; left: 3px; transition: 0.3s; } }
    input:checked ~ .toggle-track { background: var(--color-primary); &::after { transform: translateX(18px); } }
    .td-actions { display: flex; gap: 4px; }
    .action-btn { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 4px; cursor: pointer; color: var(--color-text-muted); display: flex; mat-icon { font-size: 16px; } &:hover { color: var(--color-primary); } &.action-del:hover { color: var(--color-urgent); border-color: var(--color-urgent); } &.action-pwd:hover { color: #E65100; } }
  `]
})
export class CompteComponent {
  showForm = signal(false);
  search = '';
  roleFilter = '';

  form = { name: '', username: '', password: '', role: 'consultation', service: '' };

  users = signal<UserAccount[]>([
    { id: 'u1', username: 'admin', name: 'Administrateur Système', role: 'superadmin', service: 'Direction', active: true, lastLogin: 'Il y a 2 min' },
    { id: 'u2', username: 'nour', name: 'Dr. Bennaoum Nour', role: 'consultation', service: 'Médecine générale', active: true, lastLogin: 'Il y a 1h' },
    { id: 'u3', username: 'rad1', name: 'Dr. Khelili M', role: 'radio', service: 'Radiologie', active: true, lastLogin: 'Hier, 15:30' },
    { id: 'u4', username: 'labi1', name: 'Lamine Boussouf', role: 'labo', service: 'Laboratoire', active: false, lastLogin: 'Il y a 3 jours' },
    { id: 'u5', username: 'bde1', name: 'Amira Hadj Ali', role: 'bde', service: 'BDE', active: true, lastLogin: 'Aujourd\'hui, 08:00' },
  ]);

  filteredUsers = () => this.users().filter(u => {
    const matchSearch = !this.search || u.name.toLowerCase().includes(this.search.toLowerCase()) || u.username.includes(this.search);
    const matchRole = !this.roleFilter || u.role === this.roleFilter;
    return matchSearch && matchRole;
  });

  roleLabel(r: string): string {
    const m: Record<string, string> = { superadmin: 'Super Admin', consultation: 'Médecin', radio: 'Radiologue', labo: 'Laborantin', bde: 'BDE', pharmacie: 'Pharmacien' };
    return m[r] ?? r;
  }

  initials(u: UserAccount): string {
    return u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  toggleUser(u: UserAccount): void {
    this.users.update(users => users.map(user => user.id === u.id ? { ...user, active: !user.active } : user));
  }

  deleteUser(id: string): void {
    this.users.update(users => users.filter(u => u.id !== id));
  }
}
