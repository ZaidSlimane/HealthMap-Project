import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { ChefApiService, Box } from '../chef.service';

@Component({
  selector: 'app-box-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hm-page-header
      [title]="isEditMode() ? 'Modifier la Box' : 'Nouvelle Box'"
      [subtitle]="isEditMode() ? 'Modifier les informations de la box' : 'Créer une nouvelle box de consultation'"
      icon="meeting_room">
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

    @if (loading()) {
      <div class="loading">Chargement...</div>
    } @else {
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-container">
        <div class="form-group">
          <label for="label_ar" class="form-label">Label (Arabe) <span class="required">*</span></label>
          <input
            id="label_ar"
            type="text"
            formControlName="label_ar"
            class="form-input"
            [class.input-error]="isFieldInvalid('label_ar')"
            dir="rtl"
            placeholder="اسم البوكس" />
          @if (isFieldInvalid('label_ar')) {
            <span class="field-error">Le label en arabe est requis.</span>
          }
        </div>

        <div class="form-group">
          <label for="label_fr" class="form-label">Label (Français) <span class="required">*</span></label>
          <input
            id="label_fr"
            type="text"
            formControlName="label_fr"
            class="form-input"
            [class.input-error]="isFieldInvalid('label_fr')"
            placeholder="Nom de la box" />
          @if (isFieldInvalid('label_fr')) {
            <span class="field-error">Le label en français est requis.</span>
          }
        </div>

        <div class="form-group">
          <label for="type" class="form-label">Type <span class="required">*</span></label>
          <select
            id="type"
            formControlName="type"
            class="form-input form-select"
            [class.input-error]="isFieldInvalid('type')">
            <option value="" disabled>Sélectionner un type</option>
            <option value="consultation">Consultation</option>
            <option value="observation">Observation</option>
            <option value="urgence">Urgence</option>
          </select>
          @if (isFieldInvalid('type')) {
            <span class="field-error">Le type est requis.</span>
          }
        </div>

        <div class="form-group form-group-toggle">
          <label class="toggle-label">
            <input
              type="checkbox"
              formControlName="is_active"
              class="toggle-input" />
            <span class="toggle-switch"></span>
            <span class="toggle-text">Box active</span>
          </label>
        </div>

        <div class="form-actions">
          <a routerLink="/chef/boxes" class="btn-cancel">Annuler</a>
          <button type="submit" class="btn-submit" [disabled]="submitting()">
            @if (submitting()) {
              <span class="spinner"></span>
            }
            {{ isEditMode() ? 'Enregistrer' : 'Créer' }}
          </button>
        </div>
      </form>
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

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--color-text-muted, #64748b);
      font-size: 14px;
    }

    .form-container {
      background: var(--color-surface, #fff);
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--color-border, #e2e8f0);
      padding: 24px;
      max-width: 560px;
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

    .form-group-toggle {
      margin-top: 24px;
    }

    .toggle-label {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      user-select: none;
    }

    .toggle-input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-switch {
      position: relative;
      width: 40px;
      height: 22px;
      background: #cbd5e1;
      border-radius: 11px;
      transition: background 0.2s ease;
    }

    .toggle-switch::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 16px;
      height: 16px;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.2s ease;
    }

    .toggle-input:checked + .toggle-switch {
      background: var(--color-primary, #00BCD4);
    }

    .toggle-input:checked + .toggle-switch::after {
      transform: translateX(18px);
    }

    .toggle-text {
      font-size: 14px;
      color: var(--color-text, #0f172a);
      font-weight: 500;
    }

    .form-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid var(--color-border, #e2e8f0);
    }

    .btn-cancel {
      padding: 10px 18px;
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--color-border, #e2e8f0);
      background: var(--color-surface, #fff);
      color: var(--color-text-muted, #64748b);
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .btn-cancel:hover {
      border-color: var(--color-text-muted, #64748b);
      color: var(--color-text, #0f172a);
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
  `]
})
export class BoxFormComponent implements OnInit {
  private readonly chefApi = inject(ChefApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isEditMode = signal(false);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  private boxId: number | null = null;

  readonly form = new FormGroup({
    label_ar: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    label_fr: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<'consultation' | 'observation' | 'urgence' | ''>('', { nonNullable: true, validators: [Validators.required] }),
    is_active: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.boxId = +id;
      this.isEditMode.set(true);
      this.loadBox(this.boxId);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    const formValue = this.form.getRawValue() as { label_ar: string; label_fr: string; type: 'consultation' | 'observation' | 'urgence'; is_active: boolean };

    if (this.isEditMode() && this.boxId) {
      this.chefApi.updateBox(this.boxId, formValue).subscribe({
        next: () => {
          this.router.navigate(['/chef/boxes']);
        },
        error: () => {
          this.errorMessage.set('Une erreur est survenue lors de la mise à jour.');
          this.submitting.set(false);
        }
      });
    } else {
      this.chefApi.createBox(formValue).subscribe({
        next: () => {
          this.router.navigate(['/chef/boxes']);
        },
        error: () => {
          this.errorMessage.set('Une erreur est survenue lors de la création.');
          this.submitting.set(false);
        }
      });
    }
  }

  private loadBox(id: number): void {
    this.loading.set(true);
    this.chefApi.getBox(id).subscribe({
      next: (box: Box) => {
        this.form.patchValue({
          label_ar: box.label_ar,
          label_fr: box.label_fr,
          type: box.type,
          is_active: box.is_active,
        });
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erreur lors du chargement de la box.');
        this.loading.set(false);
      }
    });
  }
}
