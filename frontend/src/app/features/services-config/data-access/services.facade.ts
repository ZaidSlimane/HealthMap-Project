import { Injectable, inject, signal, computed } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { ServicesStore } from '../services-store';
import { EstablishmentApiService, EstablishmentDto, EstablishmentUpdateDto } from './establishment-api.service';
import { ServiceApiService } from '../../../core/services/service-api.service';
import { ServiceConfig, totalLitsService, litsOccupesService, totalSallesService } from '../models/service-config.model';
import { firstValueFrom } from 'rxjs';

export interface ServiceTypeDto {
  id: number;
  label: string;
  code?: string;
}

@Injectable({ providedIn: 'root' })
export class ServicesFacade {
  private readonly auth = inject(AuthService);
  private readonly store = inject(ServicesStore);
  private readonly estApi = inject(EstablishmentApiService);
  private readonly svcApi = inject(ServiceApiService);

  // ── Delegated from store ──
  readonly services = this.store.services;
  readonly serviceTypes = this.store.serviceTypes;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  // ── Establishment state ──
  private _establishment = signal<EstablishmentDto | null>(null);
  private _estLoading = signal(false);
  private _estError = signal<string | null>(null);

  readonly establishment = this._establishment.asReadonly();
  readonly estLoading = this._estLoading.asReadonly();
  readonly estError = this._estError.asReadonly();

  // ── Computed stats ──
  readonly totalServices = computed(() => this.services().length);
  readonly totalUnites = computed(() => this.services().reduce((a, s) => a + s.units.length, 0));
  readonly totalSalles = computed(() => this.services().reduce((a, s) => a + totalSallesService(s), 0));
  readonly totalLits = computed(() => this.services().reduce((a, s) => a + totalLitsService(s), 0));
  readonly totalOccupes = computed(() => this.services().reduce((a, s) => a + litsOccupesService(s), 0));
  readonly globalOccPct = computed(() => {
    const t = this.totalLits();
    return t > 0 ? Math.round((this.totalOccupes() / t) * 100) : 0;
  });

  readonly establishmentName = computed(() => {
    return this._establishment()?.name
      ?? this.auth.currentUser()?.establishment?.name
      ?? 'Établissement';
  });

  // ── Actions ──

  ensureLoaded(): void {
    this.store.ensureLoaded();
    this.loadEstablishment();
  }

  async loadEstablishment(): Promise<void> {
    const user = this.auth.currentUser();
    const estId = user?.establishment?.id;
    if (!estId || this._establishment()) return;

    this._estLoading.set(true);
    this._estError.set(null);
    try {
      const est = await firstValueFrom(this.estApi.getById(estId));
      this._establishment.set(est);
    } catch (e: any) {
      this._estError.set(e?.message ?? 'Erreur chargement établissement');
    } finally {
      this._estLoading.set(false);
    }
  }

  async updateEstablishment(data: EstablishmentUpdateDto): Promise<void> {
    const est = this._establishment();
    if (!est) throw new Error('No establishment loaded');

    this._estLoading.set(true);
    try {
      const updated = await firstValueFrom(this.estApi.update(est.id, data));
      this._establishment.set(updated);
    } catch (e: any) {
      this._estError.set(e?.message ?? 'Erreur mise à jour');
      throw e;
    } finally {
      this._estLoading.set(false);
    }
  }

  async upsertService(svc: ServiceConfig): Promise<void> {
    await this.store.upsert(svc);
  }

  async removeService(id: string): Promise<void> {
    await this.store.remove(id);
  }

  async reloadServiceTypes(): Promise<void> {
    await this.store.loadServices(true);
  }
}
