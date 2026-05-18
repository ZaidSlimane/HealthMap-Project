import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { ChefApiService, Box, ServiceDoctor, DoctorShiftAssignment } from '../chef.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-box-assign',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hm-page-header
      title="Assigner un Médecin"
      [subtitle]="box() ? 'Assigner un médecin à la box: ' + box()!.label_fr : 'Chargement...'"
      icon="assignment_ind">
      <a routerLink="/chef/boxes" class="btn-back">
        <span class="material-icons">arrow_back</span>
        Retour
      </a>
    </hm-page-header>

    @if (errorMessage()) {
      <div class="error-banner">
        <span class="material-icons">error</span>
        {{ errorMessage() }}
      </div>
    }

    @if (successMessage()) {
      <div class="success-banner">
        <span class="material-icons">check_circle</span>
        {{ successMessage() }}
      </div>
    }

    @if (loading()) {
      <div class="loading">Chargement...</div>
    } @else {
      <div class="content-grid">
        <!-- Assignment Form -->
        <div class="form-container">
          <h2 class="section-title">Nouvelle assignation</h2>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="user_id" class="form-label">Médecin <span class="required">*</span></label>
              <select
                id="user_id"
                formControlName="user_id"
                class="form-input form-select"
                [class.input-error]="isFieldInvalid('user_id')">
                <option value="" disabled>Sélectionner un médecin</option>
                @for (doctor of doctors(); track doctor.id) {
                  <option [value]="doctor.id">{{ doctor.name }}</option>
                }
              </select>
              @if (isFieldInvalid('user_id')) {
                <span class="field-error">Le médecin est requis.</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Jours de la semaine <span class="required">*</span></label>
              <div class="days-grid">
                @for (day of daysOfWeek; track day) {
                  <label class="day-checkbox">
                    <input
                      type="checkbox"
                      [value]="day"
                      (change)="onDayChange(day, $event)"
                      [checked]="isDaySelected(day)" />
                    <span class="day-label">{{ day | titlecase }}</span>
                  </label>
                }
              </div>
              @if (form.get('day_of_week')?.touched && form.get('day_of_week')?.hasError('required')) {
                <span class="field-error">Au moins un jour doit être sélectionné.</span>
              }
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="start_time" class="form-label">Heure de début <span class="required">*</span></label>
                <input
                  id="start_time"
                  type="time"
                  formControlName="start_time"
                  class="form-input"
                  [class.input-error]="isFieldInvalid('start_time')" />
                @if (isFieldInvalid('start_time')) {
                  <span class="field-error">L'heure de début est requise.</span>
                }
              </div>

              <div class="form-group">
                <label for="end_time" class="form-label">Heure de fin <span class="required">*</span></label>
                <input
                  id="end_time"
                  type="time"
                  formControlName="end_time"
                  class="form-input"
                  [class.input-error]="isFieldInvalid('end_time')" />
                @if (isFieldInvalid('end_time')) {
                  <span class="field-error">L'heure de fin est requise.</span>
                }
              </div>
            </div>

            @if (form.hasError('timeRange')) {
              <div class="field-error time-error">L'heure de début doit être antérieure à l'heure de fin.</div>
            }

            <div class="form-actions">
              <button type="submit" class="btn-submit" [disabled]="submitting()">
                @if (submitting()) {
                  <span class="spinner"></span>
                }
                Assigner
              </button>
            </div>
          </form>
        </div>

        <!-- Existing Assignments -->
        <div class="assignments-container">
          <h2 class="section-title">Assignations existantes</h2>

          @if (assignments().length === 0) {
            <div class="empty-state">
              <span class="material-icons">event_busy</span>
              <p>Aucune assignation pour cette box.</p>
            </div>
          } @else {
            <div class="assignments-list">
              @for (assignment of assignments(); track assignment.id) {
                <div class="assignment-card">
                  <div class="assignment-info">
                    <span class="assignment-doctor">{{ getDoctorName(assignment.user_id) }}</span>
                    <span class="assignment-schedule">
                      {{ formatDays(assignment.day_of_week) }}
                    </span>
                    <span class="assignment-time">
                      {{ assignment.start_time }} - {{ assignment.end_time }}
                    </span>
                  </div>
                  <button
                    class="btn-delete"
                    (click)="deleteAssignment(assignment.id)"
                    [disabled]="deleting()">
                    <span class="material-icons">delete</span>
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--color-border, #e2e8f0);
      background: var(--color-surface, #fff);
      color: var(--color-text-muted, #64748b);
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .btn-back:hover {
      border-color: var(--color-primary, #00BCD4);
      color: var(--color-primary, #00BCD4);
    }

    .btn-back .material-icons {
      font-size: 16px;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      border-radius: var(--radius-md, 10px);
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      font-size: 14px;
    }

    .error-banner .material-icons {
      font-size: 20px;
    }

    .success-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      border-radius: var(--radius-md, 10px);
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #16a34a;
      font-size: 14px;
    }

    .success-banner .material-icons {
      font-size: 20px;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--color-text-muted, #64748b);
      font-size: 14px;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      align-items: start;
    }

    @media (max-width: 900px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
      margin: 0 0 16px;
    }

    .form-container {
      background: var(--color-surface, #fff);
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--color-border, #e2e8f0);
      padding: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
    }

    .required {
      color: #dc2626;
    }

    .form-input {
      width: 100%;
      padding: 10px 14px;
      border-radius: var(--radius-sm, 6px);
      border: 1px solid var(--color-border, #e2e8f0);
      font-size: 14px;
      color: var(--color-text, #0f172a);
      background: var(--color-surface, #fff);
      transition: border-color 0.2s ease;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-primary, #00BCD4);
      box-shadow: 0 0 0 3px rgba(0, 188, 212, 0.1);
    }

    .form-input.input-error {
      border-color: #dc2626;
    }

    .form-select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 36px;
    }

    .field-error {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      color: #dc2626;
    }

    .time-error {
      margin-bottom: 12px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .days-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 8px;
    }

    .day-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: var(--radius-sm, 6px);
      border: 1px solid var(--color-border, #e2e8f0);
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
    }

    .day-checkbox:hover {
      border-color: var(--color-primary, #00BCD4);
      background: rgba(0, 188, 212, 0.04);
    }

    .day-checkbox input[type="checkbox"] {
      accent-color: var(--color-primary, #00BCD4);
      width: 16px;
      height: 16px;
    }

    .day-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text, #0f172a);
    }

    .form-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--color-border, #e2e8f0);
    }

    .btn-submit {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 22px;
      border-radius: var(--radius-md, 10px);
      border: none;
      background: var(--color-primary, #00BCD4);
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .btn-submit:hover:not(:disabled) {
      background: var(--color-primary-dark, #0097A7);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Assignments section */
    .assignments-container {
      background: var(--color-surface, #fff);
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--color-border, #e2e8f0);
      padding: 24px;
    }

    .empty-state {
      text-align: center;
      padding: 32px 16px;
      color: var(--color-text-muted, #64748b);
    }

    .empty-state .material-icons {
      font-size: 40px;
      margin-bottom: 8px;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
    }

    .assignments-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .assignment-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: var(--radius-sm, 6px);
      border: 1px solid var(--color-border, #e2e8f0);
      background: var(--color-bg, #f8fafc);
    }

    .assignment-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .assignment-doctor {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
    }

    .assignment-schedule {
      font-size: 12px;
      color: var(--color-text-muted, #64748b);
    }

    .assignment-time {
      font-size: 12px;
      color: var(--color-primary, #00BCD4);
      font-weight: 500;
    }

    .btn-delete {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm, 6px);
      border: 1px solid #fecaca;
      background: #fef2f2;
      color: #dc2626;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-delete:hover:not(:disabled) {
      background: #dc2626;
      color: #fff;
      border-color: #dc2626;
    }

    .btn-delete:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-delete .material-icons {
      font-size: 16px;
    }
  `]
})
export class BoxAssignComponent implements OnInit {
  private readonly chefApi = inject(ChefApiService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly daysOfWeek = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly box = signal<Box | null>(null);
  readonly doctors = signal<ServiceDoctor[]>([]);
  readonly assignments = signal<DoctorShiftAssignment[]>([]);

  private boxId!: number;

  readonly form = new FormGroup({
    user_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    day_of_week: new FormControl<string[]>([], { nonNullable: true, validators: [this.atLeastOneDayValidator] }),
    start_time: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    end_time: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  }, { validators: [this.timeRangeValidator] });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.boxId = +id;
      this.loadData();
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isDaySelected(day: string): boolean {
    return this.form.get('day_of_week')!.value.includes(day);
  }

  onDayChange(day: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const currentDays = [...this.form.get('day_of_week')!.value];

    if (checkbox.checked) {
      if (!currentDays.includes(day)) {
        currentDays.push(day);
      }
    } else {
      const index = currentDays.indexOf(day);
      if (index > -1) {
        currentDays.splice(index, 1);
      }
    }

    this.form.get('day_of_week')!.setValue(currentDays);
    this.form.get('day_of_week')!.markAsTouched();
  }

  getDoctorName(userId: number): string {
    const doctor = this.doctors().find(d => d.id === userId);
    return doctor ? doctor.name : 'Médecin inconnu';
  }

  formatDays(days: string[]): string {
    return days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formValue = this.form.getRawValue();
    const data = {
      user_id: +formValue.user_id,
      day_of_week: formValue.day_of_week,
      start_time: formValue.start_time,
      end_time: formValue.end_time,
    };

    this.chefApi.createAssignment(this.boxId, data).subscribe({
      next: (assignment) => {
        this.successMessage.set('Assignation créée avec succès.');
        this.assignments.update(list => [...list, assignment]);
        this.form.reset({ user_id: '', day_of_week: [], start_time: '', end_time: '' });
        this.submitting.set(false);
      },
      error: () => {
        this.errorMessage.set('Une erreur est survenue lors de la création de l\'assignation.');
        this.submitting.set(false);
      }
    });
  }

  deleteAssignment(assignmentId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette assignation ?')) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.chefApi.deleteAssignment(assignmentId).subscribe({
      next: () => {
        this.assignments.update(list => list.filter(a => a.id !== assignmentId));
        this.successMessage.set('Assignation supprimée avec succès.');
        this.deleting.set(false);
      },
      error: () => {
        this.errorMessage.set('Une erreur est survenue lors de la suppression.');
        this.deleting.set(false);
      }
    });
  }

  private loadData(): void {
    this.loading.set(true);

    forkJoin({
      box: this.chefApi.getBox(this.boxId),
      doctors: this.chefApi.getDoctors(),
    }).subscribe({
      next: ({ box, doctors }) => {
        this.box.set(box);
        this.doctors.set(doctors);
        this.loadAssignments();
      },
      error: () => {
        this.errorMessage.set('Erreur lors du chargement des données.');
        this.loading.set(false);
      }
    });
  }

  private loadAssignments(): void {
    this.http.get<DoctorShiftAssignment[]>(
      `${environment.baseUrl}/chef/boxes/${this.boxId}/assignments`
    ).subscribe({
      next: (assignments) => {
        this.assignments.set(assignments);
        this.loading.set(false);
      },
      error: () => {
        // If endpoint doesn't exist yet, just finish loading
        this.loading.set(false);
      }
    });
  }

  private atLeastOneDayValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value as string[];
    return value && value.length > 0 ? null : { required: true };
  }

  private timeRangeValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('start_time')?.value;
    const end = group.get('end_time')?.value;

    if (start && end && start >= end) {
      return { timeRange: true };
    }
    return null;
  }
}
