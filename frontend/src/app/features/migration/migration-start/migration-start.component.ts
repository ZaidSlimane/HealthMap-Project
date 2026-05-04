import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-migration-start',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mig-start-page">
      <div class="ms-header">
        <button class="btn-back" routerLink="/migration"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <h1>Nouvelle migration</h1>
          <p>Transfert de données depuis un système source</p>
        </div>
      </div>

      @if (step() === 1) {
        <div class="ms-card">
          <h3>Étape 1 — Choisir la source</h3>
          <div class="source-grid">
            @for (s of sources; track s.id) {
              <button class="source-btn" [class.active]="selectedSource() === s.id" (click)="selectedSource.set(s.id)">
                <mat-icon>{{ s.icon }}</mat-icon>
                <strong>{{ s.label }}</strong>
                <span>{{ s.description }}</span>
              </button>
            }
          </div>
          <div class="ms-nav">
            <button class="btn-next" (click)="step.set(2)" [disabled]="!selectedSource()"><mat-icon>arrow_forward</mat-icon> Suivant</button>
          </div>
        </div>
      }

      @if (step() === 2) {
        <div class="ms-card">
          <h3>Étape 2 — Choisir les entités à migrer</h3>
          <div class="entity-list">
            @for (e of entities; track e.id) {
              <label class="entity-row">
                <input type="checkbox" [(ngModel)]="e.selected" />
                <div class="er-info">
                  <strong>{{ e.label }}</strong>
                  <span>{{ e.count.toLocaleString('fr') }} enregistrements</span>
                </div>
                <span class="er-size">{{ e.size }}</span>
              </label>
            }
          </div>
          <div class="ms-nav">
            <button class="btn-prev" (click)="step.set(1)">Retour</button>
            <button class="btn-next" (click)="startMigration()"><mat-icon>play_arrow</mat-icon> Lancer</button>
          </div>
        </div>
      }

      @if (step() === 3) {
        <div class="ms-card">
          <h3>Migration en cours...</h3>
          <div class="mig-progress-items">
            @for (e of selectedEntities(); track e.id) {
              <div class="mpi">
                <span class="mpi-label">{{ e.label }}</span>
                <div class="mpi-bar"><div class="mpi-fill" [style.width.%]="progress()"></div></div>
                <span class="mpi-pct">{{ Math.round(progress()) }}%</span>
              </div>
            }
          </div>
          @if (progress() >= 100) {
            <div class="mig-done">
              <mat-icon>check_circle</mat-icon>
              <h3>Migration terminée avec succès !</h3>
              <button class="btn-back-btn" routerLink="/migration">Voir le tableau de bord</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .mig-start-page { padding: var(--space-6); max-width: 720px; }
    .ms-header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-6); h1 { font-size: 20px; font-weight: 700; margin: 0; } p { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; } }
    .btn-back { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 6px; cursor: pointer; display: flex; mat-icon { font-size: 20px; } }
    .ms-card { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-md); h3 { font-size: 16px; font-weight: 700; margin: 0 0 var(--space-5); } }
    .source-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); margin-bottom: var(--space-5); }
    .source-btn { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); padding: var(--space-5); border-radius: var(--radius-xl); border: 1px solid var(--color-border); background: transparent; cursor: pointer; text-align: center; transition: all 0.2s; mat-icon { font-size: 32px; color: var(--color-primary); } strong { font-size: 14px; } span { font-size: 12px; color: var(--color-text-muted); } &.active { border-color: var(--color-primary); background: rgba(0,188,212,0.06); } }
    .entity-list { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-5); }
    .entity-row { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--color-border); cursor: pointer; input { accent-color: var(--color-primary); } }
    .er-info { flex: 1; strong { display: block; font-size: 14px; } span { font-size: 12px; color: var(--color-text-muted); } }
    .er-size { font-size: 12px; color: var(--color-text-muted); font-family: var(--font-mono); }
    .ms-nav { display: flex; justify-content: space-between; }
    .btn-prev { background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 13px; cursor: pointer; color: var(--color-text-muted); }
    .btn-next { display: inline-flex; align-items: center; gap: var(--space-2); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 13px; font-weight: 600; cursor: pointer; mat-icon { font-size: 16px; } &:disabled { opacity: 0.5; cursor: default; } }
    .mig-progress-items { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-5); }
    .mpi { display: flex; align-items: center; gap: var(--space-3); }
    .mpi-label { min-width: 160px; font-size: 13px; }
    .mpi-bar { flex: 1; height: 12px; background: var(--color-background); border-radius: var(--radius-full); overflow: hidden; }
    .mpi-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); transition: width 0.3s; }
    .mpi-pct { font-family: var(--font-mono); font-size: 12px; font-weight: 700; color: var(--color-primary); min-width: 40px; text-align: right; }
    .mig-done { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); text-align: center; padding: var(--space-5); mat-icon { font-size: 48px; color: #4CAF50; } h3 { margin: 0; } }
    .btn-back-btn { background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 13px; font-weight: 600; cursor: pointer; }
  `]
})
export class MigrationStartComponent {
  Math = Math;
  step = signal(1);
  selectedSource = signal<string | null>(null);
  progress = signal(0);

  sources = [
    { id: 'ophims', icon: 'inventory_2', label: 'OPHIMS', description: 'Système hospitalier national' },
    { id: 'csv', icon: 'table_chart', label: 'Fichier CSV/Excel', description: 'Export manuel' },
    { id: 'access', icon: 'storage', label: 'Base Access', description: 'Microsoft Access .mdb' },
    { id: 'autre', icon: 'help', label: 'Autre', description: 'Autre format ou système' },
  ];

  entities = [
    { id: 'patients', label: 'Patients', count: 2847, size: '12.4 Mo', selected: true },
    { id: 'dossiers', label: 'Dossiers médicaux', count: 2847, size: '85 Mo', selected: true },
    { id: 'ordonnances', label: 'Ordonnances', count: 5120, size: '4.2 Mo', selected: false },
    { id: 'exams', label: 'Résultats d\'examens', count: 8934, size: '220 Mo', selected: false },
  ];

  selectedEntities() { return this.entities.filter(e => e.selected); }

  startMigration(): void {
    this.step.set(3);
    let curr = 0;
    const interval = setInterval(() => {
      curr += 2;
      this.progress.set(curr);
      if (curr >= 100) clearInterval(interval);
    }, 80);
  }
}
