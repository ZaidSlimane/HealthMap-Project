import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { StatCardComponent } from '../../shared/ui/stat-card/stat-card.component';
import { AuthService } from '../../core/auth/auth.service';

interface Doctor {
  id: number;
  name: string;
  first_name: string;
  matricule: string | null;
  email: string | null;
  is_active: boolean;
  is_consultant: boolean;
  service: { id: number; name: string } | null;
  services: { id: number; name: string }[];
  poste: { id: number; label: string; label_ar: string } | null;
  establishment: { id: number; name: string } | null;
}

interface ServiceOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-medecins',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, StatCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './medecins.component.html',
  styleUrl: './medecins.component.scss',
})
export class MedecinsComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  doctors = signal<Doctor[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  services = signal<ServiceOption[]>([]);

  totalDoctors = computed(() => this.doctors().length);
  activeDoctors = computed(() => this.doctors().filter(d => d.is_active).length);
  consultants = computed(() => this.doctors().filter(d => d.is_consultant).length);

  establishmentName = signal('');

  // Add form state
  showForm = signal(false);
  saving = signal(false);
  formData = signal({
    name: '',
    first_name: '',
    email: '',
    service_ids: [] as number[],
    is_consultant: false,
  });

  ngOnInit(): void {
    const user = this.auth.currentUser();
    this.establishmentName.set(user?.establishment?.name ?? 'Établissement');
    this.loadDoctors();
    this.loadServices();
  }

  private loadDoctors(): void {
    this.loading.set(true);
    this.http.get<{ data: Doctor[] }>(`${environment.baseUrl}/admin/doctors?per_page=100`)
      .subscribe({
        next: (res) => {
          this.doctors.set(res.data ?? []);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Erreur de chargement');
          this.loading.set(false);
        }
      });
  }

  private loadServices(): void {
    this.http.get<ServiceOption[]>(`${environment.baseUrl}/admin/services`)
      .subscribe({
        next: (res) => this.services.set(res ?? []),
        error: () => {}
      });
  }

  fullName(d: Doctor): string {
    return [d.name, d.first_name].filter(Boolean).join(' ') || `Médecin #${d.id}`;
  }

  openForm(): void {
    this.formData.set({ name: '', first_name: '', email: '', service_ids: [], is_consultant: false });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  patchForm(key: string, value: any): void {
    this.formData.update(f => ({ ...f, [key]: value }));
  }

  toggleService(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.formData.update(f => {
      const ids = checked
        ? [...f.service_ids, id]
        : f.service_ids.filter(x => x !== id);
      return { ...f, service_ids: ids };
    });
  }

  async saveDoctor(): Promise<void> {
    const f = this.formData();
    if (!f.name?.trim()) { alert('Le nom est obligatoire.'); return; }

    this.saving.set(true);
    try {
      // Get the Doctor role ID
      const roles: any[] = await this.http.get<any[]>(`${environment.baseUrl}/admin/roles`).toPromise() ?? [];
      const doctorRole = roles.find(r => r.role === 'Doctor');
      if (!doctorRole) { alert('Rôle "Doctor" introuvable.'); this.saving.set(false); return; }

      // Create the user as personnel with Doctor role
      const payload: any = {
        name: f.name.trim(),
        first_name: f.first_name.trim(),
        email: f.email.trim() || null,
        service_id: f.service_ids.length > 0 ? f.service_ids[0] : null,
        service_ids: f.service_ids,
        is_consultant: f.is_consultant,
        role_ids: [doctorRole.id],
      };

      await this.http.post(`${environment.baseUrl}/admin/personnel`, payload).toPromise();
      this.showForm.set(false);
      this.loadDoctors();
    } catch (e: any) {
      alert(`Erreur : ${e?.error?.message ?? e?.message ?? 'Erreur inconnue'}`);
    } finally {
      this.saving.set(false);
    }
  }

  async deleteDoctor(id: number, name: string): Promise<void> {
    if (!confirm(`Supprimer le médecin "${name}" ?`)) return;
    try {
      await this.http.delete(`${environment.baseUrl}/admin/personnel/${id}`).toPromise();
      this.loadDoctors();
    } catch (e: any) {
      alert(`Erreur : ${e?.error?.message ?? e?.message ?? 'Erreur'}`);
    }
  }
}
