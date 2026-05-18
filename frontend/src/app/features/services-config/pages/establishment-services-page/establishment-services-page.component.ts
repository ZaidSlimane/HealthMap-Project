import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { ServicesFacade } from '../../data-access/services.facade';
import { ServiceApiService } from '../../../../core/services/service-api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'hm-establishment-services-page',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './establishment-services-page.component.html',
  styleUrl: './establishment-services-page.component.scss',
})
export class EstablishmentServicesPageComponent {
  readonly facade = inject(ServicesFacade);
  private readonly svcApi = inject(ServiceApiService);

  constructor() { this.facade.ensureLoaded(); }

  allTypes = this.facade.serviceTypes;
  services = this.facade.services;
  loading = this.facade.loading;

  // New type form
  showAddForm = signal(false);
  newTypeLabel = signal('');
  adding = signal(false);
  toggling = signal<number | null>(null);

  // Track which service types have services in the establishment
  selectedTypeIds = computed(() => {
    const ids = new Set<number>();
    for (const svc of this.services()) {
      if (typeof svc.type === 'number') ids.add(svc.type);
    }
    return ids;
  });

  isSelected(typeId: number): boolean {
    return this.selectedTypeIds().has(typeId);
  }

  countByType(typeId: number): number {
    return this.services().filter(s => s.type === typeId).length;
  }

  /**
   * Toggle a service type:
   * - Check → creates a Service record for this establishment with the type's label as name
   * - Uncheck → deletes the service(s) of that type
   */
  async toggleType(typeId: number, event: Event): Promise<void> {
    const checked = (event.target as HTMLInputElement).checked;
    const typeItem = this.allTypes().find((t: any) => t.id === typeId);
    if (!typeItem) return;

    this.toggling.set(typeId);

    try {
      if (checked) {
        // Create a service for this type
        await firstValueFrom(this.svcApi.create({
          name: typeItem.label.toUpperCase(),
          service_type_id: typeId,
          code: String(typeId),
          is_active: true,
        } as any));
      } else {
        // Delete all services of this type
        const svcsOfType = this.services().filter(s => s.type === typeId);
        for (const svc of svcsOfType) {
          await firstValueFrom(this.svcApi.delete(svc.id));
        }
      }
      // Reload to reflect changes in dashboard
      await this.facade.reloadServiceTypes();
    } catch (e: any) {
      alert(`Erreur : ${e?.message ?? e}`);
      // Revert checkbox
      (event.target as HTMLInputElement).checked = !checked;
    } finally {
      this.toggling.set(null);
    }
  }

  // ── CRUD for service types ──

  async addType(): Promise<void> {
    const label = this.newTypeLabel().trim();
    if (!label) return;
    this.adding.set(true);
    try {
      await firstValueFrom(this.svcApi.createServiceType({ label }));
      this.newTypeLabel.set('');
      this.showAddForm.set(false);
      await this.facade.reloadServiceTypes();
    } catch (e: any) {
      alert(`Erreur : ${e?.message ?? e}`);
    } finally {
      this.adding.set(false);
    }
  }

  async deleteType(id: number, label: string): Promise<void> {
    const count = this.countByType(id);
    if (count > 0) {
      alert(`Impossible de supprimer "${label}" : ${count} service(s) l'utilisent encore. Décochez-le d'abord.`);
      return;
    }
    if (!confirm(`Supprimer le type "${label}" ?`)) return;
    try {
      await firstValueFrom(this.svcApi.deleteServiceType(id));
      await this.facade.reloadServiceTypes();
    } catch (e: any) {
      alert(`Erreur : ${e?.message ?? e}`);
    }
  }
}
