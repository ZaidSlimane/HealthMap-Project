import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface HospitalNode {
  id: string;
  name: string;
  type: 'CHU' | 'EPH' | 'EPSP' | 'clinique';
  wilaya: string;
  status: 'active' | 'degraded' | 'offline';
  lastSync: string;
  patients: number;
}

@Component({
  selector: 'app-reseau',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="reseau-page">
      <div class="reseau-header">
        <div>
          <h1 class="reseau-title">Réseau Hospitalier</h1>
          <p class="reseau-sub">Connectivité et synchronisation inter-établissements</p>
        </div>
        <div class="hdr-stats">
          <span class="stat-chip stat-active">{{ active() }} établissements actifs</span>
          <span class="stat-chip stat-offline">{{ offline() }} hors ligne</span>
        </div>
      </div>

      <div class="network-grid">
        @for (node of nodes; track node.id) {
          <div class="node-card" [class]="'node-' + node.status" (click)="selectedNode.set(node)">
            <div class="node-header">
              <div class="node-icon" [class]="'ni-' + node.type">
                <mat-icon>{{ typeIcon(node.type) }}</mat-icon>
              </div>
              <div class="node-status-dot" [class]="'dot-' + node.status"></div>
            </div>
            <h3 class="node-name">{{ node.name }}</h3>
            <p class="node-wilaya">{{ node.wilaya }}</p>
            <div class="node-meta">
              <span class="nm-badge">{{ node.type }}</span>
              <span class="nm-patients">{{ node.patients }} patients</span>
            </div>
            <div class="node-sync">
              <mat-icon>sync</mat-icon> {{ node.lastSync }}
            </div>
          </div>
        }
      </div>

      @if (selectedNode()) {
        <div class="node-detail-panel">
          <div class="ndp-header">
            <h3>{{ selectedNode()!.name }}</h3>
            <button class="close-btn" (click)="selectedNode.set(null)"><mat-icon>close</mat-icon></button>
          </div>
          <div class="ndp-body">
            <div class="ndp-stat"><label>Statut</label><span class="status-pill" [class]="'sp-' + selectedNode()!.status">{{ statusLabel(selectedNode()!.status) }}</span></div>
            <div class="ndp-stat"><label>Type</label><p>{{ selectedNode()!.type }}</p></div>
            <div class="ndp-stat"><label>Wilaya</label><p>{{ selectedNode()!.wilaya }}</p></div>
            <div class="ndp-stat"><label>Patients partagés</label><p>{{ selectedNode()!.patients }}</p></div>
            <div class="ndp-stat"><label>Dernière synchro</label><p>{{ selectedNode()!.lastSync }}</p></div>
          </div>
          <div class="ndp-actions">
            <button class="btn-sync"><mat-icon>sync</mat-icon> Synchroniser maintenant</button>
            <button class="btn-detail"><mat-icon>open_in_new</mat-icon> Voir les patients partagés</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .reseau-page { padding: var(--space-6); }
    .reseau-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
    .reseau-title { font-size: 22px; font-weight: 700; margin: 0; }
    .reseau-sub { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; }
    .hdr-stats { display: flex; gap: var(--space-2); }
    .stat-chip { padding: 6px 14px; border-radius: var(--radius-full); font-size: 12px; font-weight: 700;
      &.stat-active { background: rgba(76,175,80,0.1); color: #2E7D32; }
      &.stat-offline { background: rgba(229,57,53,0.1); color: #C62828; }
    }
    .network-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); margin-bottom: var(--space-5); }
    .node-card { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-4); box-shadow: var(--shadow-md); cursor: pointer; border: 1px solid var(--color-border); transition: all 0.2s; &:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); } &.node-degraded { border-left: 4px solid #FF9800; } &.node-offline { border-left: 4px solid #E53935; opacity: 0.8; } }
    .node-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-3); }
    .node-icon { width: 44px; height: 44px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; mat-icon { font-size: 22px; } &.ni-chu { background: rgba(0,188,212,0.1); color: var(--color-primary); } &.ni-eph { background: rgba(76,175,80,0.1); color: #2E7D32; } &.ni-epsp { background: rgba(156,39,176,0.1); color: #7B1FA2; } &.ni-clinique { background: rgba(255,152,0,0.1); color: #E65100; } }
    .node-status-dot { width: 10px; height: 10px; border-radius: 50%; &.dot-active { background: #4CAF50; box-shadow: 0 0 6px rgba(76,175,80,0.6); } &.dot-degraded { background: #FF9800; } &.dot-offline { background: #E53935; } }
    .node-name { font-size: 14px; font-weight: 700; margin: 0 0 4px; color: var(--color-text); }
    .node-wilaya { font-size: 12px; color: var(--color-text-muted); margin: 0 0 var(--space-3); }
    .node-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2); }
    .nm-badge { font-size: 11px; font-weight: 700; background: rgba(0,188,212,0.1); color: var(--color-primary); padding: 2px 8px; border-radius: var(--radius-full); }
    .nm-patients { font-size: 12px; color: var(--color-text-muted); }
    .node-sync { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--color-text-muted); mat-icon { font-size: 14px; } }
    .node-detail-panel { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-lg); border: 1px solid var(--color-border); }
    .ndp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); h3 { font-size: 16px; font-weight: 700; margin: 0; } }
    .close-btn { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 4px; cursor: pointer; display: flex; mat-icon { font-size: 18px; } }
    .ndp-body { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); margin-bottom: var(--space-4); }
    .ndp-stat { label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); display: block; margin-bottom: 4px; } p { font-size: 14px; color: var(--color-text); margin: 0; font-weight: 600; } }
    .status-pill { padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700; &.sp-active { background: rgba(76,175,80,0.1); color: #2E7D32; } &.sp-degraded { background: rgba(255,152,0,0.1); color: #E65100; } &.sp-offline { background: rgba(229,57,53,0.1); color: #C62828; } }
    .ndp-actions { display: flex; gap: var(--space-3); }
    .btn-sync, .btn-detail { display: inline-flex; align-items: center; gap: var(--space-2); border-radius: var(--radius-md); padding: 10px var(--space-4); font-size: 13px; font-weight: 600; cursor: pointer; mat-icon { font-size: 16px; } }
    .btn-sync { background: var(--color-primary); color: #fff; border: none; }
    .btn-detail { background: transparent; border: 1px solid var(--color-border); color: var(--color-text-muted); }
  `]
})
export class ReseauComponent {
  selectedNode = signal<HospitalNode | null>(null);

  nodes: HospitalNode[] = [
    { id: 'h1', name: 'CHU Mustapha Pacha', type: 'CHU', wilaya: 'Alger', status: 'active', lastSync: 'Il y a 2 min', patients: 124 },
    { id: 'h2', name: 'EPH de Bab El Oued', type: 'EPH', wilaya: 'Alger', status: 'active', lastSync: 'Il y a 5 min', patients: 67 },
    { id: 'h3', name: 'EPSP El Harrach', type: 'EPSP', wilaya: 'Alger', status: 'degraded', lastSync: 'Il y a 45 min', patients: 23 },
    { id: 'h4', name: 'CHU Annaba', type: 'CHU', wilaya: 'Annaba', status: 'active', lastSync: 'Il y a 8 min', patients: 89 },
    { id: 'h5', name: 'EPH Blida', type: 'EPH', wilaya: 'Blida', status: 'offline', lastSync: 'Il y a 3h', patients: 0 },
    { id: 'h6', name: 'Clinique El Nour', type: 'clinique', wilaya: 'Alger', status: 'active', lastSync: 'Il y a 1 min', patients: 31 },
  ];

  active = () => this.nodes.filter(n => n.status === 'active').length;
  offline = () => this.nodes.filter(n => n.status === 'offline').length;

  typeIcon(t: HospitalNode['type']): string {
    return { CHU: 'local_hospital', EPH: 'apartment', EPSP: 'health_and_safety', clinique: 'medical_services' }[t];
  }

  statusLabel(s: HospitalNode['status']): string {
    return { active: 'Actif', degraded: 'Dégradé', offline: 'Hors ligne' }[s];
  }
}
