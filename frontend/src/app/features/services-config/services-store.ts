import { Injectable, signal, computed, inject } from '@angular/core';
import { ServiceConfig, BedStatus } from './models/service-config.model';
import { ServiceApiService } from '../../core/services/service-api.service';

@Injectable({ providedIn: 'root' })
export class ServicesStore {
  private api = inject(ServiceApiService);

  private _services = signal<ServiceConfig[]>([]);
  private _loading = signal<boolean>(false);
  private _loaded = signal<boolean>(false);
  private _error = signal<string | null>(null);

  readonly services = this._services.asReadonly();
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
        const response = await this.api.getAll().toPromise();
        if (response && response.data) {
          this._services.set(response.data.data ?? []);
          this._loaded.set(true);
        }
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
      const existing = svc.id && this._services().some(s => s.id === svc.id);
      const updated = existing
        ? await this.api.update(svc.id, svc).toPromise()
        : await this.api.create(svc).toPromise();

      this._services.update(list => {
        if (!updated) return list;
        return list.some(s => s.id === updated.id)
          ? list.map(s => s.id === updated.id ? updated! : s)
          : [...list, updated!];
      });
    } catch (e: any) {
      this._error.set(e?.message || 'Failed to upsert service');
      throw new Error(e?.message || 'Failed to upsert service');
    }
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
