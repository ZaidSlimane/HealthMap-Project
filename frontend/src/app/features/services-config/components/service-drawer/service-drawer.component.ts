import {
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges,
  signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ServiceConfig, Unit, Room, Bed, ServiceType, UnitType, BedStatus, User,
  ALL_SERVICE_TYPES, ALL_UNIT_TYPES, TYPE_COLOR, typeColorById,
  totalLitsUnite, litsOccupesUnite
} from '../../models/service-config.model';

type Tab = 'general' | 'unites' | 'salles';

type DrawerForm = {
  name: string;
  type: ServiceType;
  code: string;
};

@Component({
  selector: 'hm-service-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-drawer.component.html',
  styleUrl: './service-drawer.component.scss',
})
export class ServiceDrawerComponent implements OnChanges {
  @Input() open  = false;
  @Input() mode: 'ADD' | 'EDIT' = 'ADD';
  @Input() service: ServiceConfig | null = null;

  @Output() saved   = new EventEmitter<ServiceConfig>();
  @Output() closed  = new EventEmitter<void>();

  activeTab = signal<Tab>('general');
  allTypes  = ALL_SERVICE_TYPES;
  allUnitTypes = ALL_UNIT_TYPES;

  form = signal<DrawerForm>({ name: '', type: 1, code: '1' });
  chefNom = signal<string>('');
  coordinateurNom = signal<string>('');
  actif = signal<boolean>(true);

  unites = signal<Unit[]>([]);

  selectedUniteId = signal<string | null>(null);
  selectedUnite = computed(() =>
    this.unites().find(u => u.id === this.selectedUniteId()) ?? null
  );

  showAddUnit   = signal(false);
  newUnitNom    = signal('');
  newUnitType   = signal<UnitType>('Admission Classique');
  editingUnitId = signal<string | null>(null);

  showAddSalle   = signal(false);
  newSalleNom    = signal('');
  newSalleType   = signal('Chambre');
  newSalleCap    = signal(2);
  editingSalleId = signal<string | null>(null);

  readonly salleTypes = ['Chambre', 'Box', 'Bloc', 'Bureau', 'Salle commune'];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['service'] || changes['open']) {
      if (this.open) {
        this.activeTab.set('general');
        this.showAddUnit.set(false);
        this.showAddSalle.set(false);
        this.editingUnitId.set(null);
        this.editingSalleId.set(null);

        if (this.service && this.mode === 'EDIT') {
          const s = this.service;
          this.form.set({ name: s.name, type: s.type, code: s.code });
          this.chefNom.set(s.chief?.name ?? '');
          this.coordinateurNom.set(s.medical_chief?.name ?? '');
          this.actif.set(s.is_active);
          this.unites.set(JSON.parse(JSON.stringify(s.units)));
          this.selectedUniteId.set(s.units[0]?.id ?? null);
        } else {
          this.form.set({ name: '', type: 1, code: '1' });
          this.chefNom.set('');
          this.coordinateurNom.set('');
          this.actif.set(true);
          this.unites.set([]);
          this.selectedUniteId.set(null);
        }
      }
    }
  }

  setTab(t: Tab): void { this.activeTab.set(t); }

  patchForm<K extends keyof DrawerForm>(key: K, val: DrawerForm[K]): void {
    this.form.update(f => ({ ...f, [key]: val }));
  }

  get typeColor(): string {
    const t = this.form().type;
    return typeof t === 'number' ? typeColorById(t) : (TYPE_COLOR[t] ?? '#546E7A');
  }

  private makeUser(name: string): User {
    return { id: '', name, first_name: '', email: '', is_active: true };
  }

  save(): void {
    const f = this.form();
    if (!f.name?.trim()) { alert('Le nom du service est obligatoire.'); return; }
    const code = Number(f.code);
    if (!f.code || !Number.isFinite(code) || code < 1 || code > 99) {
      alert('Le code carte doit être entre 1 et 99.');
      return;
    }

    const svc: ServiceConfig = {
      id:             this.mode === 'EDIT' ? this.service!.id : 'svc-' + Date.now(),
      name:           f.name.trim().toUpperCase(),
      type:           f.type as ServiceType,
      code:           String(code),
      chief:          this.makeUser(this.chefNom().trim()),
      medical_chief:  this.makeUser(this.coordinateurNom().trim()),
      is_active:      this.actif(),
      units:          this.unites(),
    };
    this.saved.emit(svc);
  }

  close(): void { this.closed.emit(); }

  totalLitsUnite = totalLitsUnite;
  litsOccupesUnite = litsOccupesUnite;

  uniteTypeColor(u: Unit): string {
    const map: Record<UnitType, string> = {
      'Admission Classique': '#1565C0', 'Soins Intensifs': '#E53935',
      'Réanimation': '#B71C1C', 'Pédiatrie': '#7B1FA2',
      'Maternité': '#880E4F', 'Chirurgie Ambulatoire': '#F57C00', 'Autre': '#546E7A',
    };
    return map[u.unit_type] ?? '#546E7A';
  }

  addUnit(): void {
    if (!this.newUnitNom().trim()) return;
    const u: Unit = {
      id: 'u-' + Date.now(),
      name: this.newUnitNom().trim(),
      unit_type: this.newUnitType(),
      rooms: [],
    };
    this.unites.update(list => [...list, u]);
    this.newUnitNom.set('');
    this.showAddUnit.set(false);
    if (!this.selectedUniteId()) this.selectedUniteId.set(u.id);
  }

  startEditUnit(u: Unit): void {
    this.editingUnitId.set(u.id);
  }

  saveEditUnit(u: Unit, name: string, unit_type: UnitType): void {
    this.unites.update(list =>
      list.map(x => x.id === u.id ? { ...x, name: name.trim(), unit_type } : x)
    );
    this.editingUnitId.set(null);
  }

  deleteUnit(id: string): void {
    this.unites.update(list => list.filter(u => u.id !== id));
    if (this.selectedUniteId() === id) {
      this.selectedUniteId.set(this.unites()[0]?.id ?? null);
    }
  }

  addSalle(): void {
    if (!this.newSalleNom().trim() || !this.selectedUniteId()) return;
    const cap = Math.max(1, this.newSalleCap());
    const beds: Bed[] = Array.from({ length: cap }, (_, i) => ({
      id: 'l-' + Date.now() + '-' + i,
      bed_number: `Lit ${String(i + 1).padStart(2, '0')}`,
      status: 'free' as BedStatus,
    }));
    const salle: Room = {
      id: 's-' + Date.now(),
      name: this.newSalleNom().trim(),
      type: this.newSalleType(),
      capacity: cap,
      beds,
    };
    const uid = this.selectedUniteId()!;
    this.unites.update(list =>
      list.map(u => u.id === uid ? { ...u, rooms: [...u.rooms, salle] } : u)
    );
    this.newSalleNom.set('');
    this.newSalleCap.set(2);
    this.showAddSalle.set(false);
  }

  deleteSalle(salleId: string): void {
    const uid = this.selectedUniteId();
    if (!uid) return;
    this.unites.update(list =>
      list.map(u => u.id === uid
        ? { ...u, rooms: u.rooms.filter((s: Room) => s.id !== salleId) }
        : u)
    );
  }

  updateSalleCapacite(salleId: string, newCap: number): void {
    const uid = this.selectedUniteId();
    if (!uid) return;
    const cap = Math.max(1, newCap);
    this.unites.update(list =>
      list.map(u => u.id === uid
        ? {
            ...u,
            rooms: u.rooms.map((s: Room) => {
              if (s.id !== salleId) return s;
              const oldBeds = s.beds;
              const beds: Bed[] = Array.from({ length: cap }, (_, i) =>
                oldBeds[i] ?? {
                  id: 'l-' + Date.now() + '-' + i,
                  bed_number: `Lit ${String(i + 1).padStart(2, '0')}`,
                  status: 'free' as BedStatus,
                }
              );
              return { ...s, capacity: cap, beds };
            })
          }
        : u)
    );
  }

  toggleLitStatut(salleId: string, litId: string): void {
    const uid = this.selectedUniteId();
    if (!uid) return;
    const cycle: BedStatus[] = ['free', 'occupied', 'maintenance'];
    this.unites.update(list =>
      list.map(u => u.id === uid
        ? {
            ...u,
            rooms: u.rooms.map((s: Room) => s.id !== salleId ? s : {
              ...s,
              beds: s.beds.map((l: Bed) => {
                if (l.id !== litId) return l;
                const next = cycle[(cycle.indexOf(l.status) + 1) % cycle.length];
                return { ...l, status: next };
              })
            })
          }
        : u)
    );
  }

  litColor(s: BedStatus): string {
    return s === 'free' ? '#22C55E' : s === 'occupied' ? '#EF4444' : '#9CA3AF';
  }

  litIcon(s: BedStatus): string {
    return s === 'free' ? 'check_circle' : s === 'occupied' ? 'person' : 'build';
  }

  trackById(_: number, item: { id: string }): string { return item.id; }
}
