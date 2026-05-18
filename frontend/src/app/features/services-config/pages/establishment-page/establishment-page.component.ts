import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { ServicesFacade } from '../../data-access/services.facade';
import { EstablishmentDto } from '../../data-access/establishment-api.service';

@Component({
  selector: 'hm-establishment-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './establishment-page.component.html',
  styleUrl: './establishment-page.component.scss',
})
export class EstablishmentPageComponent implements OnInit {
  readonly facade = inject(ServicesFacade);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  saving = signal(false);
  saved = signal(false);
  editing = signal(false);

  ngOnInit(): void {
    this.facade.ensureLoaded();
    // Wait for establishment to load then build form
    setTimeout(() => this.buildForm(), 500);
  }

  private buildForm(): void {
    const est = this.facade.establishment();
    this.form = this.fb.group({
      name: [est?.name ?? '', Validators.required],
      name_ar: [est?.name_ar ?? ''],
      directeur: [est?.directeur ?? ''],
      phone: [est?.phone ?? ''],
      fax: [est?.fax ?? ''],
    });
  }

  startEdit(): void {
    this.editing.set(true);
    this.buildForm();
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.buildForm();
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.saved.set(false);
    try {
      await this.facade.updateEstablishment(this.form.value);
      this.saved.set(true);
      this.editing.set(false);
      setTimeout(() => this.saved.set(false), 3000);
    } catch (e: any) {
      alert(`Erreur : ${e?.message ?? e}`);
    } finally {
      this.saving.set(false);
    }
  }
}
