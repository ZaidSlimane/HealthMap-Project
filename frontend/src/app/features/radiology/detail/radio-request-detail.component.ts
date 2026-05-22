import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { RadioService } from '../services/radio.service';

@Component({
  selector: 'app-radio-request-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hm-page-header
      title="Détail de la demande radiologique"
      subtitle="Saisie du résultat"
      icon="radiology">
      <button class="btn-back" (click)="goBack()">
        <span class="material-icons">arrow_back</span>
        Retour au worklist
      </button>
    </hm-page-header>

    @if (loading()) {
      <hm-spinner label="Chargement de la demande..." />
    } @else if (errorMessage()) {
      <div class="error-banner">
        <span class="material-icons">error</span>
        {{ errorMessage() }}
      </div>
    } @else {
      <div class="detail-grid">
        <!-- Patient Info Cards -->
        <div class="info-cards">
          <div class="info-card card-blue">
            <span class="material-icons">person</span>
            <div>
              <div class="info-label">Patient</div>
              <div class="info-value">{{ request()?.patient?.nom }} {{ request()?.patient?.prenom }}</div>
            </div>
          </div>
          <div class="info-card card-green">
            <span class="material-icons">medical_services</span>
            <div>
              <div class="info-label">Examen(s)</div>
              <div class="info-value">{{ getExamSummary() }}</div>
            </div>
          </div>
          <div class="info-card card-orange">
            <span class="material-icons">priority_high</span>
            <div>
              <div class="info-label">Urgence</div>
              <div class="info-value">{{ request()?.urgency === 'urgente' ? 'Urgente' : 'Normale' }}</div>
            </div>
          </div>
        </div>

        <!-- Doctor Notes -->
        @if (request()?.notes) {
          <div class="notes-section">
            <h3 class="section-title">Notes du médecin</h3>
            <p class="notes-text">{{ request()?.notes }}</p>
          </div>
        }

        <!-- Result Upload Form -->
        <div class="form-section">
          <h3 class="section-title">Saisie du résultat</h3>

          <div class="form-group">
            <label class="form-label">Fichier résultat (PDF, JPEG, PNG, DICOM)</label>
            <input
              type="file"
              class="file-input"
              accept=".pdf,.jpeg,.jpg,.png,.dcm"
              (change)="onFileSelected($event)" />
            @if (selectedFileName()) {
              <span class="file-name">{{ selectedFileName() }}</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label">Compte rendu</label>
            <textarea
              class="form-textarea"
              rows="6"
              placeholder="Saisir le compte rendu..."
              [(ngModel)]="compteRendu">
            </textarea>
          </div>

          @if (submitError()) {
            <div class="error-banner">
              <span class="material-icons">error</span>
              {{ submitError() }}
            </div>
          }

          <button
            class="btn-submit"
            [disabled]="submitting()"
            (click)="onSubmit()">
            @if (submitting()) {
              <hm-spinner [size]="16" [inline]="true" />
            }
            <span class="material-icons">upload_file</span>
            Soumettre le résultat
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: var(--radius-sm, 6px);
      border: 1px solid var(--color-border, #e2e8f0);
      background: var(--color-surface, #fff);
      color: var(--color-text, #0f172a);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-back:hover {
      background: var(--color-surface-alt, #f8fafc);
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

    .detail-grid {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .info-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .info-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--color-border, #e2e8f0);
    }

    .info-card .material-icons {
      font-size: 28px;
      padding: 8px;
      border-radius: 8px;
    }

    .card-blue {
      background: #eff6ff;
    }
    .card-blue .material-icons {
      color: #2563eb;
      background: rgba(37, 99, 235, 0.1);
    }

    .card-green {
      background: #f0fdf4;
    }
    .card-green .material-icons {
      color: #16a34a;
      background: rgba(22, 163, 106, 0.1);
    }

    .card-orange {
      background: #fffbeb;
    }
    .card-orange .material-icons {
      color: #d97706;
      background: rgba(217, 119, 6, 0.1);
    }

    .info-label {
      font-size: 12px;
      color: var(--color-text-muted, #64748b);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-value {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
      margin-top: 2px;
    }

    .notes-section {
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      padding: 16px;
    }

    .section-title {
      margin: 0 0 12px;
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
    }

    .notes-text {
      margin: 0;
      font-size: 14px;
      color: var(--color-text-muted, #64748b);
      line-height: 1.5;
    }

    .form-section {
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      padding: 20px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text, #0f172a);
      margin-bottom: 6px;
    }

    .file-input {
      display: block;
      width: 100%;
      padding: 10px;
      border: 1px dashed var(--color-border, #e2e8f0);
      border-radius: var(--radius-sm, 6px);
      background: var(--color-surface-alt, #f8fafc);
      font-size: 13px;
      cursor: pointer;
    }

    .file-name {
      display: block;
      margin-top: 6px;
      font-size: 12px;
      color: var(--color-primary, #00BCD4);
      font-weight: 500;
    }

    .form-textarea {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-sm, 6px);
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      transition: border-color 0.2s ease;
    }

    .form-textarea:focus {
      outline: none;
      border-color: var(--color-primary, #00BCD4);
    }

    .btn-submit {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: var(--radius-md, 10px);
      background: var(--color-primary, #00BCD4);
      color: #fff;
      border: none;
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

    .btn-submit .material-icons {
      font-size: 18px;
    }
  `]
})
export class RadioRequestDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly radioService = inject(RadioService);

  readonly request = signal<any>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly selectedFileName = signal('');
  readonly submitError = signal('');
  readonly submitting = signal(false);

  compteRendu = '';
  private selectedFile: File | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadRequest(id);
  }

  goBack(): void {
    this.router.navigate(['/radiology']);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.selectedFileName.set(this.selectedFile.name);
    }
  }

  onSubmit(): void {
    if (!this.selectedFile && !this.compteRendu) {
      this.submitError.set('Veuillez sélectionner un fichier ou saisir un compte rendu.');
      return;
    }

    this.submitError.set('');
    this.submitting.set(true);

    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }
    if (this.compteRendu) {
      formData.append('compte_rendu', this.compteRendu);
    }

    const id = this.request()?.id;
    this.radioService.uploadResult(id, formData).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/radiology']);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err.error?.message || err.error?.errors?.file?.[0] || 'Erreur lors de la soumission du résultat.';
        this.submitError.set(msg);
      }
    });
  }

  getExamSummary(): string {
    const req = this.request();
    if (req?.items && req.items.length > 0) {
      return req.items.map((i: any) => i.exam_type?.name || i.radiology_exam_type?.name || '').filter(Boolean).join(', ');
    }
    return '—';
  }

  private loadRequest(id: number): void {
    this.loading.set(true);
    this.radioService.getRequestDetail(id).subscribe({
      next: (response: any) => {
        const data = response.data || response;
        this.request.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erreur lors du chargement de la demande.');
        this.loading.set(false);
      }
    });
  }
}
