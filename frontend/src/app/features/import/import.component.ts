import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="import-page">
      <div class="import-header">
        <h1>Import de données patients</h1>
        <p>Importer depuis un fichier CSV, Excel ou un autre système HIS</p>
      </div>

      <div class="import-layout">
        <!-- LEFT: Upload zone -->
        <div class="import-card">
          <h3 class="ic-title"><mat-icon>upload_file</mat-icon> Fichier à importer</h3>

          <div class="dropzone" [class.dragging]="isDragging()"
               (dragover)="isDragging.set(true)" (dragleave)="isDragging.set(false)"
               (drop)="onDrop($event)">
            <mat-icon>cloud_upload</mat-icon>
            <h3>Glisser votre fichier ici</h3>
            <p>ou <label class="file-label">parcourir<input type="file" accept=".csv,.xlsx,.xls" (change)="onFileSelect($event)" /></label></p>
            <p class="formats">Formats acceptés: CSV, XLSX, XLS — Max 50 Mo</p>
          </div>

          @if (selectedFile()) {
            <div class="file-info">
              <mat-icon>insert_drive_file</mat-icon>
              <div>
                <strong>{{ selectedFile()!.name }}</strong>
                <span>{{ formatSize(selectedFile()!.size) }}</span>
              </div>
              <button class="remove-file" (click)="selectedFile.set(null)"><mat-icon>close</mat-icon></button>
            </div>
          }

          <div class="import-options">
            <h4>Options d'import</h4>
            <label class="opt-row">
              <input type="checkbox" [(ngModel)]="skipDuplicates" /> Ignorer les doublons (NIS existants)
            </label>
            <label class="opt-row">
              <input type="checkbox" [(ngModel)]="updateExisting" /> Mettre à jour les dossiers existants
            </label>
            <label class="opt-row">
              <input type="checkbox" [(ngModel)]="dryRun" /> Mode simulation (aucune écriture)
            </label>
          </div>

          <button class="btn-import" [disabled]="!selectedFile()" (click)="startImport()">
            <mat-icon>play_arrow</mat-icon> Lancer l'import
          </button>
        </div>

        <!-- RIGHT: Status + mapping -->
        <div class="import-right">
          @if (importState() === 'idle') {
            <div class="format-info">
              <h3 class="ic-title"><mat-icon>table_chart</mat-icon> Format attendu</h3>
              <div class="format-cols">
                @for (col of columns; track col.key) {
                  <div class="format-col">
                    <span class="col-key">{{ col.key }}</span>
                    <span class="col-req" [class.required]="col.required">{{ col.required ? 'Requis' : 'Optionnel' }}</span>
                    <span class="col-desc">{{ col.description }}</span>
                  </div>
                }
              </div>
              <button class="btn-template"><mat-icon>download</mat-icon> Télécharger le modèle CSV</button>
            </div>
          }

          @if (importState() === 'running') {
            <div class="import-progress">
              <h3>Import en cours...</h3>
              <div class="progress-bar">
                <div class="pb-fill" [style.width.%]="progress()"></div>
              </div>
              <p>{{ Math.round(progress()) }}% — {{ processedRows() }} / {{ totalRows() }} lignes traitées</p>
            </div>
          }

          @if (importState() === 'done') {
            <div class="import-result">
              <div class="ir-icon"><mat-icon>check_circle</mat-icon></div>
              <h3>Import terminé</h3>
              <div class="ir-stats">
                <div class="ir-stat ir-ok"><span class="irs-val">{{ imported() }}</span><span>Importés</span></div>
                <div class="ir-stat ir-skip"><span class="irs-val">{{ skipped() }}</span><span>Ignorés</span></div>
                <div class="ir-stat ir-err"><span class="irs-val">{{ errors() }}</span><span>Erreurs</span></div>
              </div>
              <button class="btn-new-import" (click)="reset()"><mat-icon>refresh</mat-icon> Nouvel import</button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .import-page { padding: var(--space-6); }
    .import-header { margin-bottom: var(--space-6); h1 { font-size: 22px; font-weight: 700; margin: 0; } p { font-size: 13px; color: var(--color-text-muted); margin: 4px 0 0; } }
    .import-layout { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); }
    .import-card { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-md); display: flex; flex-direction: column; gap: var(--space-4); }
    .ic-title { display: flex; align-items: center; gap: var(--space-2); font-size: 14px; font-weight: 700; margin: 0; color: var(--color-text); mat-icon { font-size: 18px; color: var(--color-primary); } }
    .dropzone { border: 2px dashed var(--color-border); border-radius: var(--radius-xl); padding: var(--space-8); text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--space-2); transition: all 0.2s;
      mat-icon { font-size: 48px; color: var(--color-text-muted); }
      h3 { margin: 0; font-size: 16px; color: var(--color-text); }
      p { margin: 0; font-size: 13px; color: var(--color-text-muted); }
      &.dragging { border-color: var(--color-primary); background: rgba(0,188,212,0.04); }
    }
    .file-label { color: var(--color-primary); cursor: pointer; input { display: none; } }
    .formats { font-size: 11px; color: var(--color-text-muted); }
    .file-info { display: flex; align-items: center; gap: var(--space-3); background: rgba(0,188,212,0.06); border: 1px solid rgba(0,188,212,0.2); border-radius: var(--radius-md); padding: var(--space-3); mat-icon { color: var(--color-primary); } div { flex: 1; strong { display: block; font-size: 13px; } span { font-size: 11px; color: var(--color-text-muted); } } }
    .remove-file { background: transparent; border: none; cursor: pointer; color: var(--color-text-muted); display: flex; mat-icon { font-size: 16px; } }
    .import-options { display: flex; flex-direction: column; gap: var(--space-2); h4 { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); margin: 0 0 var(--space-2); } }
    .opt-row { display: flex; align-items: center; gap: var(--space-2); font-size: 13px; cursor: pointer; input { accent-color: var(--color-primary); } }
    .btn-import { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); padding: 12px; font-size: 14px; font-weight: 700; cursor: pointer; width: 100%; mat-icon { font-size: 20px; } &:disabled { opacity: 0.5; cursor: default; } }
    .import-right { display: flex; flex-direction: column; gap: var(--space-5); }
    .format-info { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-md); display: flex; flex-direction: column; gap: var(--space-4); }
    .format-cols { display: flex; flex-direction: column; gap: var(--space-2); }
    .format-col { display: grid; grid-template-columns: 120px 80px 1fr; gap: var(--space-3); align-items: center; padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border); &:last-child { border: none; } }
    .col-key { font-family: var(--font-mono); font-size: 12px; font-weight: 700; color: var(--color-primary); }
    .col-req { font-size: 11px; padding: 2px 6px; border-radius: var(--radius-full); &.required { background: rgba(229,57,53,0.1); color: #C62828; } &:not(.required) { background: rgba(76,175,80,0.1); color: #2E7D32; } }
    .col-desc { font-size: 12px; color: var(--color-text-muted); }
    .btn-template { display: inline-flex; align-items: center; gap: var(--space-2); background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 8px var(--space-4); font-size: 13px; cursor: pointer; color: var(--color-text-muted); mat-icon { font-size: 16px; } }
    .import-progress { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-md); text-align: center; }
    .progress-bar { height: 12px; background: var(--color-background); border-radius: var(--radius-full); overflow: hidden; margin: var(--space-4) 0; }
    .pb-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); transition: width 0.3s; }
    .import-result { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-md); text-align: center; }
    .ir-icon mat-icon { font-size: 56px; color: #4CAF50; }
    .ir-stats { display: flex; justify-content: center; gap: var(--space-6); margin: var(--space-5) 0; }
    .ir-stat { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .irs-val { font-size: 32px; font-weight: 700; }
    .ir-ok .irs-val { color: #4CAF50; }
    .ir-skip .irs-val { color: #FF9800; }
    .ir-err .irs-val { color: #E53935; }
    .btn-new-import { display: inline-flex; align-items: center; gap: var(--space-2); background: transparent; border: 1px solid var(--color-primary); color: var(--color-primary); border-radius: var(--radius-md); padding: 10px var(--space-5); font-size: 13px; font-weight: 600; cursor: pointer; mat-icon { font-size: 16px; } }
  `]
})
export class ImportComponent {
  Math = Math;

  isDragging = signal(false);
  selectedFile = signal<File | null>(null);
  importState = signal<'idle' | 'running' | 'done'>('idle');
  progress = signal(0);
  processedRows = signal(0);
  totalRows = signal(0);
  imported = signal(0);
  skipped = signal(0);
  errors = signal(0);

  skipDuplicates = true;
  updateExisting = false;
  dryRun = false;

  columns = [
    { key: 'nom', required: true, description: 'Nom de famille' },
    { key: 'prenom', required: true, description: 'Prénom' },
    { key: 'date_naissance', required: true, description: 'Date de naissance (DD/MM/YYYY)' },
    { key: 'sexe', required: true, description: 'M ou F' },
    { key: 'nis', required: false, description: 'Numéro d\'identification national de santé' },
    { key: 'telephone', required: false, description: 'Numéro de téléphone' },
    { key: 'wilaya', required: false, description: 'Wilaya de résidence' },
  ];

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.selectedFile.set(file);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.selectedFile.set(file);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  }

  startImport(): void {
    this.importState.set('running');
    this.totalRows.set(this.dryRun ? 50 : 50);
    let current = 0;
    const interval = setInterval(() => {
      current += 5;
      this.progress.set(current * 2);
      this.processedRows.set(current);
      if (current >= 50) {
        clearInterval(interval);
        this.importState.set('done');
        this.imported.set(this.dryRun ? 0 : 45);
        this.skipped.set(3);
        this.errors.set(2);
      }
    }, 120);
  }

  reset(): void {
    this.importState.set('idle');
    this.selectedFile.set(null);
    this.progress.set(0);
    this.processedRows.set(0);
    this.totalRows.set(0);
  }
}
