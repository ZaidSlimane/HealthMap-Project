import { Injectable, signal, computed, inject } from '@angular/core';
import { ServiceConfig, BedStatus } from './models/service-config.model';
import { ServiceApiService } from '../../core/services/service-api.service';

@Injectable({ providedIn: 'root' })
export class ServicesStore {
  private api = inject(ServiceApiService);

  private _services = signal<ServiceConfig[]>([]);
  private _serviceTypes = signal<any[]>([]);
  private _loading = signal<boolean>(false);
  private _loaded = signal<boolean>(false);
  private _error = signal<string | null>(null);

  readonly services = this._services.asReadonly();
  readonly serviceTypes = this._serviceTypes.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly error = this._error.asReadonly();

  private _inflight: Promise<void> | null = null;

  /** Load services from API. Idempotent: subsequent calls return the
   *  same in-flight promise, or resolve immediately if already loaded.
   *  Pass `force=true` to bypass the cache. */
  loadServices(force = false): Promise<void> {
    if (!force && this._loaded()) return Promise.resolve();
    if (this._inflight) return this._inflight;

    this._loading.set(true);
    this._error.set(null);

    this._inflight = (async () => {
      try {
        const [servicesRes, typesRes] = await Promise.all([
          this.api.getAll().toPromise(),
          this.api.getServiceTypes().toPromise()
        ]);

        if (servicesRes) {
          const normalized = (servicesRes.data ?? []).map((s: any) => ({
            ...s,
            id: String(s.id),
            type: s.service_type_id ?? s.type?.id ?? 0,
            type_label: s.type?.label ?? '',
            chief: s.chief ?? { id: '', name: '', first_name: '', email: '', is_active: true },
            medical_chief: s.medical_chief ?? s.medicalChief ?? { id: '', name: '', first_name: '', email: '', is_active: true },
            units: (s.units ?? []).map((u: any) => ({
              ...u,
              id: String(u.id),
              rooms: (u.rooms ?? []).map((r: any) => ({
                ...r,
                id: String(r.id),
                beds: (r.beds ?? []).map((b: any) => ({ ...b, id: String(b.id) })),
              })),
            })),
          }));
          this._services.set(normalized);
        }
        if (typesRes) {
          this._serviceTypes.set(typesRes.data ?? []);
        }
        this._loaded.set(true);
      } catch (e: any) {
        this._error.set(e?.message || 'Failed to load services');
        console.error('[ServicesStore] loadServices failed:', e);
      } finally {
        this._loading.set(false);
        this._inflight = null;
      }
    })();

    return this._inflight;
  }

  /** Ensure services are loaded; safe to call from many components. */
  ensureLoaded(): void {
    if (!this._loaded() && !this._inflight) {
      void this.loadServices();
    }
  }

  byId(id: string): ServiceConfig | null {
    return this._services().find(s => s.id === id) ?? null;
  }

  byIdSignal(id: () => string) {
    return computed(() => this._services().find(s => s.id === id()) ?? null);
  }

  async upsert(svc: ServiceConfig): Promise<void> {
    try {
      // Transform frontend model to backend-compatible payload
      const payload: any = {
        name: svc.name,
        code: svc.code,
        is_active: svc.is_active,
        service_type_id: svc.type,
        chief_id: (svc as any).chief_id ?? null,
        medical_chief_id: (svc as any).medical_chief_id ?? null,
      };

      // Only include units if they exist (avoids expensive nested sync on simple edits)
      if (svc.units && svc.units.length > 0) {
        payload.units = svc.units;
      }

      const existing = svc.id && this._services().some(s => s.id === svc.id);
      let saved: any;
      if (existing) {
        saved = await this.api.update(svc.id, payload).toPromise();
      } else {
        saved = await this.api.create(payload).toPromise();
      }

      // Normalize and update local state directly from response
      if (saved) {
        const normalized = this.normalizeService(saved);
        this._services.update(list => {
          const idx = list.findIndex(s => s.id === normalized.id);
          if (idx >= 0) {
            const copy = [...list];
            copy[idx] = normalized;
            return copy;
          }
          return [...list, normalized];
        });
      }
    } catch (e: any) {
      this._error.set(e?.message || 'Failed to upsert service');
      throw new Error(e?.message || 'Failed to upsert service');
    }
  }

  private normalizeService(s: any): ServiceConfig {
    return {
      ...s,
      id: String(s.id),
      type: s.service_type_id ?? s.type?.id ?? 0,
      type_label: s.type?.label ?? '',
      chief: s.chief ?? { id: '', name: '', first_name: '', email: '', is_active: true },
      medical_chief: s.medical_chief ?? s.medicalChief ?? { id: '', name: '', first_name: '', email: '', is_active: true },
      units: (s.units ?? []).map((u: any) => ({
        ...u,
        id: String(u.id),
        rooms: (u.rooms ?? []).map((r: any) => ({
          ...r,
          id: String(r.id),
          beds: (r.beds ?? []).map((b: any) => ({ ...b, id: String(b.id) })),
        })),
      })),
    };
  }

  async remove(id: string): Promise<void> {
    try {
      await this.api.delete(id).toPromise();
      this._services.update(list => list.filter(s => s.id !== id));
    } catch (e: any) {
      this._error.set(e?.message || 'Failed to remove service');
      throw new Error(e?.message || 'Failed to remove service');
    }
  }

  /** Ensure a unit has at least one virtual room+bed locally so the
   *  admission flow can reference it even before real rooms exist.
   *  Purely local; no API call. */
  ensureVirtualBed(serviceId: string, unitId: string): void {
    const svc = this.byId(serviceId);
    if (!svc) return;
    const unit = svc.units.find(u => u.id === unitId);
    if (!unit || unit.rooms.length > 0) return;

    const virtualRoomId = `${serviceId}-${unitId}-virtual`;
    const virtualBedId = `${virtualRoomId}-lit-5`;

    this._services.update(list => list.map(s => {
      if (s.id !== serviceId) return s;
      return {
        ...s,
        units: s.units.map(u => u.id !== unitId ? u : {
          ...u,
          rooms: [{
            id: virtualRoomId,
            name: 'Salle 1',
            type: 'Chambre',
            capacity: 1,
            beds: [{ id: virtualBedId, bed_number: 'Lit 05', status: 'free' as BedStatus }],
          }],
        }),
      };
    }));
  }

  /** Optimistically update local bed state, then persist by PUT-ing the
   *  full service. On failure, rolls back. */
  async setBedStatus(serviceId: string, roomId: string, bedId: string, status: BedStatus): Promise<void> {
    const before = this.byId(serviceId);
    if (!before) throw new Error('Service not found');

    const bed = before.units.flatMap(u => u.rooms).flatMap(r => r.beds).find(b => b.id === bedId);
    if (!bed) throw new Error('Bed not found');

    const apply = (svc: ServiceConfig): ServiceConfig => ({
      ...svc,
      units: svc.units.map(u => ({
        ...u,
        rooms: u.rooms.map(ro => {
          if (ro.id !== roomId) return ro;
          return { ...ro, beds: ro.beds.map(b => b.id === bedId ? { ...b, status } : b) };
        }),
      })),
    });

    // Optimistic update
    this._services.update(list => list.map(s => s.id === serviceId ? apply(s) : s));

    // Persist
    try {
      const updatedSvc = apply(before);
      const saved = await this.api.update(serviceId, updatedSvc).toPromise();
      if (saved) {
        this._services.update(list => list.map(s => s.id === serviceId ? saved : s));
      }
    } catch (e: any) {
      // Rollback
      this._services.update(list => list.map(s => s.id === serviceId ? before : s));
      this._error.set(e?.message || 'Failed to update bed status');
      throw new Error(e?.message || 'Failed to update bed status');
    }
  }
}
