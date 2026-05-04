import { Component, output, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PatientService } from '../../../core/services/patient.service';

@Component({
  selector: 'app-nis-lookup',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="nis-lookup">
      <div class="nis-input-wrap" [class.found]="foundPatient()">
        <mat-icon class="nis-prefix">badge</mat-icon>
        <input
          class="nis-input"
          [(ngModel)]="query"
          placeholder="N° NIS ou N° Dossier..."
          (input)="onInput()"
          (keydown.enter)="search()" />
        @if (loading()) {
          <mat-icon class="nis-spin">sync</mat-icon>
        } @else {
          <button class="nis-btn" (click)="search()"><mat-icon>search</mat-icon></button>
        }
      </div>

      @if (error()) {
        <div class="nis-error">
          <mat-icon>error_outline</mat-icon> {{ error() }}
        </div>
      }

      @if (foundPatient()) {
        <div class="nis-result">
          <div class="nr-avatar">{{ initials() }}</div>
          <div class="nr-info">
            <strong>{{ foundPatient()!.fullName }}</strong>
            <span>Né(e) le {{ foundPatient()!.dob }} · N° {{ foundPatient()!.admissionNumber }}</span>
          </div>
          <button class="nr-clear" (click)="clear()"><mat-icon>close</mat-icon></button>
        </div>
      }
    </div>
  `,
  styles: [`
    .nis-lookup { display: flex; flex-direction: column; gap: var(--space-2); }
    .nis-input-wrap { display: flex; align-items: center; gap: var(--space-2); background: var(--color-background); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 8px var(--space-3); transition: border-color 0.2s; &.found { border-color: #4CAF50; background: rgba(76,175,80,0.04); } }
    .nis-prefix { color: var(--color-primary); font-size: 18px; }
    .nis-input { flex: 1; border: none; background: transparent; outline: none; font-size: 13px; color: var(--color-text); font-family: var(--font-mono); }
    .nis-spin { color: var(--color-primary); font-size: 18px; animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
    .nis-btn { background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-sm); padding: 4px; cursor: pointer; display: flex; mat-icon { font-size: 16px; } }
    .nis-error { display: flex; align-items: center; gap: var(--space-2); color: var(--color-urgent); font-size: 12px; mat-icon { font-size: 14px; } }
    .nis-result { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-3); background: rgba(76,175,80,0.08); border: 1px solid rgba(76,175,80,0.3); border-radius: var(--radius-md); }
    .nr-avatar { width: 32px; height: 32px; border-radius: 50%; background: #4CAF50; color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .nr-info { flex: 1; strong { display: block; font-size: 13px; font-weight: 700; color: var(--color-text); } span { font-size: 11px; color: var(--color-text-muted); } }
    .nr-clear { background: transparent; border: none; cursor: pointer; color: var(--color-text-muted); display: flex; mat-icon { font-size: 16px; } }
  `]
})
export class NisLookupComponent {
  private patientSvc = inject(PatientService);

  patientSelected = output<{ id: number; fullName: string; dob: string; admissionNumber: number }>();
  cleared = output<void>();

  query = '';
  foundPatient = signal<{ id: number; fullName: string; dob: string; admissionNumber: number } | null>(null);
  error = signal<string | null>(null);
  loading = signal(false);

  initials = () => {
    const n = this.foundPatient()?.fullName ?? '';
    return n.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  };

  onInput(): void { this.error.set(null); }

  search(): void {
    this.loading.set(true);
    this.error.set(null);
    setTimeout(() => {
      const q = this.query.trim();
      const patients = this.patientSvc.getPatients();
      const found = patients.find(p =>
        p.admissionNumber.toString() === q ||
        p.fullName.toLowerCase().includes(q.toLowerCase())
      );
      if (found) {
        const p = { id: found.id, fullName: found.fullName, dob: found.dob, admissionNumber: found.admissionNumber };
        this.foundPatient.set(p);
        this.patientSelected.emit(p);
      } else {
        this.error.set('Aucun patient trouvé avec ce numéro ou ce nom.');
      }
      this.loading.set(false);
    }, 400);
  }

  clear(): void {
    this.query = '';
    this.foundPatient.set(null);
    this.error.set(null);
    this.cleared.emit();
  }
}
