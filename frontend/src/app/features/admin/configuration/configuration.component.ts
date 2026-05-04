import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigurationService } from './configuration.service';
import {
  Bed,
  ClinicalService,
  EstablishmentUnit,
  Room,
  ServiceType,
  UNIT_TYPES,
} from './configuration.models';

type Tab = 'services' | 'units' | 'rooms' | 'beds';

/**
 * Configuration page — backend-aligned admin shell.
 *
 * Hierarchy:    Service → Unit → Room → Bed
 *
 * Each tab manages one level. Lower levels require a parent dropdown to
 * be selected first; the form is disabled until the prerequisites exist.
 * All mutations land on /api/clinical-core/{services|establishment-units|rooms|beds}.
 */
@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cfg-page">
      <header class="cfg-header">
        <h1>Configuration de l'établissement</h1>
        <p class="cfg-sub">Définissez vos services, leurs unités, salles et lits.</p>
      </header>

      <nav class="cfg-tabs">
        <button [class.active]="tab() === 'services'" (click)="tab.set('services')">
          Services <span class="count">{{ services().length }}</span>
        </button>
        <button [class.active]="tab() === 'units'" (click)="tab.set('units')">
          Unités <span class="count">{{ units().length }}</span>
        </button>
        <button [class.active]="tab() === 'rooms'" (click)="tab.set('rooms')">
          Salles <span class="count">{{ rooms().length }}</span>
        </button>
        <button [class.active]="tab() === 'beds'" (click)="tab.set('beds')">
          Lits <span class="count">{{ beds().length }}</span>
        </button>
      </nav>

      @if (errorMsg()) {
        <div class="cfg-error">{{ errorMsg() }}</div>
      }

      <!-- ─── SERVICES ─── -->
      @if (tab() === 'services') {
        <section class="cfg-section">
          <form (ngSubmit)="addService()" class="cfg-form cfg-form-grid">
            <input type="text" placeholder="Nom du service" [(ngModel)]="newServiceName" name="svcName" required />
            <input type="text" placeholder="Code (ex. CARD)" [(ngModel)]="newServiceCode" name="svcCode" />
            <select [(ngModel)]="newServiceTypeId" name="svcType">
              <option [ngValue]="null">-- Type (optionnel) --</option>
              @for (t of serviceTypes(); track t.id) {
                <option [ngValue]="t.id">{{ t.label }}</option>
              }
            </select>
            <button type="submit" [disabled]="busy() || !newServiceName.trim()">
              Ajouter un service
            </button>
          </form>

          <table class="cfg-table">
            <thead><tr><th>ID</th><th>Nom</th><th>Code</th><th>Type</th><th>Actif</th><th></th></tr></thead>
            <tbody>
              @for (s of services(); track s.id) {
                <tr>
                  <td>{{ s.id }}</td>
                  <td>{{ s.name ?? '—' }}</td>
                  <td>{{ s.code ?? '—' }}</td>
                  <td>{{ serviceTypeLabel(s.service_type_id) }}</td>
                  <td>
                    <input type="checkbox" [checked]="s.is_active" (change)="toggleServiceActive(s)" />
                  </td>
                  <td><button class="btn-del" (click)="deleteService(s)">Supprimer</button></td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty">Aucun service.</td></tr>
              }
            </tbody>
          </table>
        </section>
      }

      <!-- ─── UNITS ─── -->
      @if (tab() === 'units') {
        <section class="cfg-section">
          @if (services().length === 0) {
            <p class="cfg-warning">Créez d'abord au moins un service dans l'onglet "Services".</p>
          }
          <form (ngSubmit)="addUnit()" class="cfg-form cfg-form-grid">
            <select [(ngModel)]="newUnitServiceId" name="unitSvc" required>
              <option [ngValue]="null" disabled>-- Service parent --</option>
              @for (s of services(); track s.id) {
                <option [ngValue]="s.id">{{ s.name }}</option>
              }
            </select>
            <input type="text" placeholder="Nom de l'unité (ex. Côté Femme)" [(ngModel)]="newUnitName" name="unitName" required />
            <select [(ngModel)]="newUnitType" name="unitType">
              <option [ngValue]="null">-- Type d'unité --</option>
              @for (t of unitTypes; track t) {
                <option [ngValue]="t">{{ t }}</option>
              }
            </select>
            <button type="submit" [disabled]="busy() || !newUnitName.trim() || newUnitServiceId === null">
              Ajouter une unité
            </button>
          </form>

          <table class="cfg-table">
            <thead><tr><th>ID</th><th>Service</th><th>Nom</th><th>Type</th><th></th></tr></thead>
            <tbody>
              @for (u of units(); track u.id) {
                <tr>
                  <td>{{ u.id }}</td>
                  <td>{{ serviceName(u.service_id) }}</td>
                  <td>{{ u.name }}</td>
                  <td>{{ u.unit_type ?? '—' }}</td>
                  <td><button class="btn-del" (click)="deleteUnit(u)">Supprimer</button></td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty">Aucune unité.</td></tr>
              }
            </tbody>
          </table>
        </section>
      }

      <!-- ─── ROOMS ─── -->
      @if (tab() === 'rooms') {
        <section class="cfg-section">
          @if (units().length === 0) {
            <p class="cfg-warning">Créez d'abord au moins une unité.</p>
          }
          <form (ngSubmit)="addRoom()" class="cfg-form cfg-form-grid">
            <select [(ngModel)]="newRoomUnitId" name="roomUnit" required>
              <option [ngValue]="null" disabled>-- Unité parente --</option>
              @for (u of units(); track u.id) {
                <option [ngValue]="u.id">{{ u.name }} ({{ serviceName(u.service_id) }})</option>
              }
            </select>
            <input type="text" placeholder="Nom (ex. Salle 1)" [(ngModel)]="newRoomName" name="roomName" required />
            <input type="text" placeholder="Type (Chambre / Box)" [(ngModel)]="newRoomType" name="roomType" />
            <input type="number" min="0" placeholder="Capacité" [(ngModel)]="newRoomCapacity" name="roomCapacity" />
            <button type="submit" [disabled]="busy() || !newRoomName.trim() || newRoomUnitId === null">
              Ajouter une salle
            </button>
          </form>

          <table class="cfg-table">
            <thead><tr><th>ID</th><th>Unité</th><th>Nom</th><th>Type</th><th>Capacité</th><th></th></tr></thead>
            <tbody>
              @for (r of rooms(); track r.id) {
                <tr>
                  <td>{{ r.id }}</td>
                  <td>{{ unitName(r.establishment_unit_id) }}</td>
                  <td>{{ r.name }}</td>
                  <td>{{ r.type ?? '—' }}</td>
                  <td>{{ r.capacity }}</td>
                  <td><button class="btn-del" (click)="deleteRoom(r)">Supprimer</button></td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty">Aucune salle.</td></tr>
              }
            </tbody>
          </table>
        </section>
      }

      <!-- ─── BEDS ─── -->
      @if (tab() === 'beds') {
        <section class="cfg-section">
          @if (rooms().length === 0) {
            <p class="cfg-warning">Créez d'abord au moins une salle.</p>
          }
          <form (ngSubmit)="addBed()" class="cfg-form cfg-form-grid">
            <select [(ngModel)]="newBedRoomId" name="bedRoom" required>
              <option [ngValue]="null" disabled>-- Salle parente --</option>
              @for (r of rooms(); track r.id) {
                <option [ngValue]="r.id">{{ r.name }} ({{ unitName(r.establishment_unit_id) }})</option>
              }
            </select>
            <input type="text" placeholder="Numéro (ex. L-001)" [(ngModel)]="newBedNumber" name="bedNum" required />
            <button type="submit" [disabled]="busy() || !newBedNumber.trim() || newBedRoomId === null">
              Ajouter un lit
            </button>
          </form>

          <table class="cfg-table">
            <thead><tr><th>ID</th><th>Salle</th><th>Numéro</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              @for (b of beds(); track b.id) {
                <tr>
                  <td>{{ b.id }}</td>
                  <td>{{ roomName(b.room_id) }}</td>
                  <td>{{ b.bed_number }}</td>
                  <td>
                    <select [ngModel]="b.status" (ngModelChange)="changeBedStatus(b, $event)" [name]="'status-' + b.id">
                      <option value="free">Libre</option>
                      <option value="occupied">Occupé</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </td>
                  <td><button class="btn-del" (click)="deleteBed(b)">Supprimer</button></td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty">Aucun lit.</td></tr>
              }
            </tbody>
          </table>
        </section>
      }
    </div>
  `,
  styles: [`
    .cfg-page { padding: 24px; max-width: 1200px; }
    .cfg-header h1 { font-size: 22px; margin: 0; }
    .cfg-sub { color: #666; margin: 4px 0 16px; font-size: 13px; }
    .cfg-tabs { display: flex; gap: 4px; border-bottom: 1px solid #e0e0e0; margin-bottom: 16px; }
    .cfg-tabs button { background: none; border: none; padding: 10px 16px; cursor: pointer; font-size: 14px; color: #666; border-bottom: 2px solid transparent; }
    .cfg-tabs button.active { color: #1565C0; border-bottom-color: #1565C0; font-weight: 600; }
    .cfg-tabs .count { background: #f0f0f0; border-radius: 999px; padding: 2px 8px; font-size: 11px; margin-left: 6px; }
    .cfg-error { background: #ffebee; color: #c62828; padding: 10px 14px; border-radius: 6px; margin-bottom: 12px; font-size: 13px; }
    .cfg-warning { background: #fff8e1; color: #795548; padding: 10px 14px; border-radius: 6px; font-size: 13px; }
    .cfg-section { background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .cfg-form { display: flex; gap: 8px; margin-bottom: 16px; align-items: center; }
    .cfg-form-grid { flex-wrap: wrap; }
    .cfg-form input, .cfg-form select { padding: 8px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; min-width: 160px; }
    .cfg-form button { padding: 8px 16px; background: #1565C0; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
    .cfg-form button:disabled { background: #b0bec5; cursor: not-allowed; }
    .cfg-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .cfg-table th { text-align: left; padding: 8px 12px; background: #fafafa; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #555; }
    .cfg-table td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
    .cfg-table .empty { text-align: center; color: #999; padding: 24px; font-style: italic; }
    .cfg-table select { padding: 4px 8px; font-size: 12px; }
    .btn-del { background: transparent; border: 1px solid #e57373; color: #c62828; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; }
    .btn-del:hover { background: #ffebee; }
  `],
})
export class ConfigurationComponent implements OnInit {
  private cfg = inject(ConfigurationService);

  readonly unitTypes = UNIT_TYPES;

  tab = signal<Tab>('services');
  busy = signal(false);
  errorMsg = signal('');

  services = signal<ClinicalService[]>([]);
  units = signal<EstablishmentUnit[]>([]);
  rooms = signal<Room[]>([]);
  beds = signal<Bed[]>([]);
  serviceTypes = signal<ServiceType[]>([]);

  // Lookup maps for table cells.
  readonly serviceById = computed(() => {
    const m: Record<number, string> = {};
    for (const s of this.services()) m[s.id] = s.name ?? `Service #${s.id}`;
    return m;
  });
  readonly unitById = computed(() => {
    const m: Record<number, string> = {};
    for (const u of this.units()) m[u.id] = u.name;
    return m;
  });
  readonly roomById = computed(() => {
    const m: Record<number, string> = {};
    for (const r of this.rooms()) m[r.id] = r.name;
    return m;
  });
  readonly serviceTypeMap = computed(() => {
    const m: Record<number, string> = {};
    for (const t of this.serviceTypes()) m[t.id] = t.label;
    return m;
  });

  // Form state
  newServiceName = '';
  newServiceCode = '';
  newServiceTypeId: number | null = null;

  newUnitName = '';
  newUnitServiceId: number | null = null;
  newUnitType: string | null = null;

  newRoomName = '';
  newRoomType = '';
  newRoomCapacity = 1;
  newRoomUnitId: number | null = null;

  newBedNumber = '';
  newBedRoomId: number | null = null;

  ngOnInit(): void {
    this.refreshAll();
  }

  // ── Lookups (template helpers) ───────────────────────────────────
  serviceName(id: number | null): string {
    return id != null ? (this.serviceById()[id] ?? '—') : '—';
  }
  unitName(id: number | null): string {
    return id != null ? (this.unitById()[id] ?? '—') : '—';
  }
  roomName(id: number | null): string {
    return id != null ? (this.roomById()[id] ?? '—') : '—';
  }
  serviceTypeLabel(id: number | null): string {
    return id != null ? (this.serviceTypeMap()[id] ?? '—') : '—';
  }

  // ── Loading ──────────────────────────────────────────────────────
  refreshAll(): void {
    this.errorMsg.set('');
    this.cfg.listServices().subscribe({ next: r => this.services.set(r.data), error: e => this.handle(e) });
    this.cfg.listUnits().subscribe({ next: r => this.units.set(r.data), error: e => this.handle(e) });
    this.cfg.listRooms().subscribe({ next: r => this.rooms.set(r.data), error: e => this.handle(e) });
    this.cfg.listBeds().subscribe({ next: r => this.beds.set(r.data), error: e => this.handle(e) });
    this.cfg.listServiceTypes().subscribe({ next: r => this.serviceTypes.set(r.data), error: e => this.handle(e) });
  }

  // ── Services ─────────────────────────────────────────────────────
  addService(): void {
    if (!this.newServiceName.trim()) return;
    this.busy.set(true);
    this.cfg.createService({
      name: this.newServiceName.trim(),
      code: this.newServiceCode.trim() || null,
      service_type_id: this.newServiceTypeId,
      is_active: true,
    }).subscribe({
      next: s => {
        this.services.update(list => [...list, s]);
        this.newServiceName = ''; this.newServiceCode = ''; this.newServiceTypeId = null;
        this.busy.set(false);
      },
      error: e => { this.handle(e); this.busy.set(false); },
    });
  }
  toggleServiceActive(s: ClinicalService): void {
    this.cfg.updateService(s.id, { is_active: !s.is_active }).subscribe({
      next: u => this.services.update(list => list.map(x => x.id === u.id ? u : x)),
      error: e => this.handle(e),
    });
  }
  deleteService(s: ClinicalService): void {
    if (!confirm(`Supprimer "${s.name ?? s.id}" et tout ce qu'il contient ?`)) return;
    this.cfg.deleteService(s.id).subscribe({
      next: () => {
        this.services.update(list => list.filter(x => x.id !== s.id));
        // Refresh dependents — cascade may have wiped units/rooms/beds.
        this.refreshAll();
      },
      error: e => this.handle(e),
    });
  }

  // ── Units ────────────────────────────────────────────────────────
  addUnit(): void {
    if (!this.newUnitName.trim() || this.newUnitServiceId === null) return;
    this.busy.set(true);
    this.cfg.createUnit({
      service_id: this.newUnitServiceId,
      name: this.newUnitName.trim(),
      unit_type: this.newUnitType,
    }).subscribe({
      next: u => {
        this.units.update(list => [...list, u]);
        this.newUnitName = ''; this.newUnitType = null;
        this.busy.set(false);
      },
      error: e => { this.handle(e); this.busy.set(false); },
    });
  }
  deleteUnit(u: EstablishmentUnit): void {
    if (!confirm(`Supprimer l'unité "${u.name}" ? Toutes ses salles et lits seront aussi supprimés.`)) return;
    this.cfg.deleteUnit(u.id).subscribe({
      next: () => {
        this.units.update(list => list.filter(x => x.id !== u.id));
        this.refreshAll();
      },
      error: e => this.handle(e),
    });
  }

  // ── Rooms ────────────────────────────────────────────────────────
  addRoom(): void {
    if (!this.newRoomName.trim() || this.newRoomUnitId === null) return;
    this.busy.set(true);
    this.cfg.createRoom({
      establishment_unit_id: this.newRoomUnitId,
      name: this.newRoomName.trim(),
      type: this.newRoomType.trim() || null,
      capacity: this.newRoomCapacity,
    }).subscribe({
      next: r => {
        this.rooms.update(list => [...list, r]);
        this.newRoomName = ''; this.newRoomType = ''; this.newRoomCapacity = 1;
        this.busy.set(false);
      },
      error: e => { this.handle(e); this.busy.set(false); },
    });
  }
  deleteRoom(r: Room): void {
    if (!confirm(`Supprimer la salle "${r.name}" ? Tous ses lits seront aussi supprimés.`)) return;
    this.cfg.deleteRoom(r.id).subscribe({
      next: () => {
        this.rooms.update(list => list.filter(x => x.id !== r.id));
        this.refreshAll();
      },
      error: e => this.handle(e),
    });
  }

  // ── Beds ─────────────────────────────────────────────────────────
  addBed(): void {
    if (!this.newBedNumber.trim() || this.newBedRoomId === null) return;
    this.busy.set(true);
    this.cfg.createBed({
      room_id: this.newBedRoomId,
      bed_number: this.newBedNumber.trim(),
      status: 'free',
    }).subscribe({
      next: b => {
        this.beds.update(list => [...list, b]);
        this.newBedNumber = '';
        this.busy.set(false);
      },
      error: e => { this.handle(e); this.busy.set(false); },
    });
  }
  changeBedStatus(b: Bed, status: string): void {
    this.cfg.updateBed(b.id, { status: status as Bed['status'] }).subscribe({
      next: updated => this.beds.update(list => list.map(x => x.id === b.id ? updated : x)),
      error: e => this.handle(e),
    });
  }
  deleteBed(b: Bed): void {
    if (!confirm(`Supprimer le lit "${b.bed_number}" ?`)) return;
    this.cfg.deleteBed(b.id).subscribe({
      next: () => this.beds.update(list => list.filter(x => x.id !== b.id)),
      error: e => this.handle(e),
    });
  }

  // ── Error handling ───────────────────────────────────────────────
  private handle(err: any): void {
    const msg = err?.error?.message
      || (err?.error?.errors ? Object.values(err.error.errors).flat().join(' ') : null)
      || err?.message
      || 'Erreur inconnue.';
    this.errorMsg.set(msg);
  }
}
