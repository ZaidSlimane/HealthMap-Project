import {
  Component, ChangeDetectionStrategy, computed, inject, signal, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import {
  ServiceConfig, Bed, Room, Unit,
  totalLitsService, litsOccupesService, tauxOccupation
} from '../../models/service-config.model';
import { ServicesStore } from '../../services-store';
import {
  AdmissionRequestService, AdmissionRequest
} from '../../../../core/services/admission-request.service';
import { AuthService } from '../../../../core/auth/auth.service';
import {
  AdmissionRequestFormComponent, AdmissionFormPayload, AdmissionFormContext
} from '../admission-request-form/admission-request-form.component';

interface BedView {
  lit: Bed;
  patientName: string | null;
  pendingReq: AdmissionRequest | null;
}

interface SalleView {
  salle: Room;
  beds: BedView[];
}

interface UniteView {
  unite: Unit;
  salles: SalleView[];
  totalLits: number;
  occupiedLits: number;
}

@Component({
  selector: 'hm-bed-management-page',
  standalone: true,
  imports: [CommonModule, RouterLink, AdmissionRequestFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (service(); as svc) {
      <div class="bmp-page">

        <!-- Header -->
        <header class="bmp-head">
          <div class="head-left">
            <a routerLink="/admin/services" class="back-btn" title="Retour aux services">
              <span class="material-icons">arrow_back</span>
            </a>
            <div>
              <h1 class="bmp-title">
                <span class="label">Service :</span>
                <span class="svc-name">{{ svc.name | titlecase }}</span>
              </h1>
              <p class="bmp-sub">{{ svc.units.length }} unité(s) — {{ totalLits() }} lit(s)</p>
            </div>
          </div>

          <div class="head-right">
            <div class="occ-track-wrap">
              <div class="occ-pct">{{ taux() }}%</div>
              <div class="occ-track">
                <div class="occ-fill" [style.width.%]="taux()"
                  [style.background]="occColor()"></div>
              </div>
              <div class="occ-meta">{{ occupied() }} / {{ totalLits() }} occupés</div>
            </div>
            <a routerLink="/admin/services" class="gestion-btn">
              <span class="material-icons">settings</span>
              Gestion du service
            </a>
          </div>
        </header>

        <!-- Units -->
        <div class="units-stack">
          @for (uv of unitesView(); track uv.unite.id) {
            <section class="unit-block">
              <div class="unit-tab">{{ uv.unite.name }}</div>
              <div class="unit-body">
                @if (uv.salles.length === 0) {
                  <div class="empty-unit">
                    <span class="material-icons">door_back</span>
                    Aucune salle configurée pour cette unité
                  </div>
                } @else {
                  @for (sv of uv.salles; track sv.salle.id) {
                    <div class="salle-row">
                      <div class="salle-tab">{{ sv.salle.name }}</div>
                      <div class="bed-strip">
                        @for (bv of sv.beds; track bv.lit.id) {
                          <button type="button" class="bed-card"
                            [class.occupied]="bv.lit.status === 'occupied'"
                            [class.pending]="bv.pendingReq"
                            [class.maintenance]="bv.lit.status === 'maintenance'"
                            [disabled]="bv.lit.status === 'occupied' || bv.lit.status === 'maintenance' || !!bv.pendingReq"
                            (click)="onBedClick(uv.unite, sv.salle, bv)">
                            <span class="bed-num">{{ bedNumber(bv.lit) }}</span>
                            @if (bv.pendingReq) {
                              <span class="bed-pill pill-validation">
                                <span class="material-icons">schedule</span> Validation
                              </span>
                            }
                            <span class="material-icons bed-icon">hotel</span>
                            <span class="bed-caption">
                              @if (bv.patientName) {
                                {{ bv.patientName }}
                              } @else if (bv.pendingReq) {
                                {{ bv.pendingReq.nom }} {{ bv.pendingReq.prenom }}
                              } @else if (bv.lit.status === 'maintenance') {
                                maintenance
                              } @else {
                                occuper ce lit
                              }
                            </span>
                          </button>
                        }
                      </div>
                    </div>
                  }
                }
              </div>
            </section>
          }
        </div>
      </div>

      <!-- Admission request form modal -->
      <hm-admission-request-form
        [open]="formOpen()"
        [context]="formContext()"
        [defaultMedecin]="medecin"
        (submitted)="onFormSubmit($event)"
        (cancelled)="closeForm()"
      />
    } @else {
      <div class="not-found">
        <span class="material-icons">error_outline</span>
        <h2>Service introuvable</h2>
        <a routerLink="/admin/services" class="back-link">Retour à la liste</a>
      </div>
    }
  `,
  styles: [`
    :host { display: block; font-family: var(--font-body, 'Plus Jakarta Sans', sans-serif); }

    .bmp-page { padding: 24px 28px; max-width: 1400px; margin: 0 auto; }

    .bmp-head {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 24px;
      margin-bottom: 24px; padding-bottom: 20px;
      border-bottom: 1px solid var(--color-border, rgba(0,0,0,0.08));
    }
    .head-left { display: flex; align-items: center; gap: 14px; }
    .back-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; border-radius: var(--radius-md, 10px);
      background: #fff; border: 1px solid var(--color-border, rgba(0,0,0,0.08));
      color: #475569; text-decoration: none; transition: all .15s;
    }
    .back-btn:hover { background: var(--color-primary-light, #E0F7FA); color: var(--color-primary-dark, #0097A7); }
    .bmp-title { margin: 0; font-size: 22px; font-weight: 700; color: #0f172a;
      font-family: var(--font-heading, 'Plus Jakarta Sans', sans-serif); display: flex; gap: 8px; align-items: baseline; }
    .bmp-title .label { color: #64748b; font-weight: 500; font-size: 18px; }
    .bmp-title .svc-name { color: var(--color-primary-dark, #0097A7); }
    .bmp-sub { margin: 4px 0 0; color: #64748b; font-size: 13px; }

    .head-right { display: flex; align-items: center; gap: 18px; }
    .occ-track-wrap { display: flex; flex-direction: column; gap: 4px; min-width: 180px; }
    .occ-pct { font-size: 14px; font-weight: 700; color: #0f172a; align-self: flex-end; }
    .occ-track { height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
    .occ-fill { height: 100%; transition: width .3s; }
    .occ-meta { font-size: 11px; color: #64748b; text-align: right; }

    .gestion-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--color-primary, #00BCD4); color: #fff; text-decoration: none;
      padding: 10px 16px; border-radius: var(--radius-md, 10px); font-weight: 700; font-size: 13px;
      transition: background .15s; box-shadow: 0 2px 6px rgba(0,188,212,.25);
    }
    .gestion-btn:hover { background: var(--color-primary-dark, #0097A7); }
    .gestion-btn .material-icons { font-size: 18px; }

    .units-stack { display: flex; flex-direction: column; gap: 24px; }

    .unit-block { position: relative; }
    .unit-tab {
      position: relative; z-index: 1; display: inline-block;
      background: #fff; border: 1px solid var(--color-border, rgba(0,0,0,0.08));
      padding: 5px 18px; border-radius: 999px; font-size: 12.5px; font-weight: 700;
      color: #334155; margin-left: 16px; margin-bottom: -12px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .unit-body {
      background: #f1f5f9; border-radius: var(--radius-lg, 14px);
      padding: 24px 18px 18px; display: flex; flex-direction: column; gap: 16px;
    }
    .empty-unit {
      display: flex; align-items: center; gap: 8px;
      color: #94a3b8; font-size: 13px; font-style: italic; padding: 16px 8px;
    }
    .empty-unit .material-icons { font-size: 18px; }

    .salle-row { position: relative; }
    .salle-tab {
      position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
      background: #475569; color: #fff;
      padding: 3px 14px; border-radius: 999px; font-size: 11.5px; font-weight: 600;
      z-index: 2; box-shadow: 0 2px 6px rgba(0,0,0,.15);
    }
    .bed-strip {
      background: #fff; border-radius: var(--radius-md, 10px);
      padding: 22px 18px 16px; display: flex; flex-wrap: wrap; gap: 14px;
      border: 1px solid #e2e8f0;
    }

    .bed-card {
      position: relative; width: 180px; min-height: 92px;
      background: #fff; border: 1px solid #e2e8f0; border-radius: var(--radius-md, 10px);
      padding: 10px 12px; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 4px; cursor: pointer; transition: all .15s; font-family: inherit;
      color: #475569;
    }
    .bed-card:not(:disabled):hover {
      border-color: var(--color-primary, #00BCD4);
      box-shadow: 0 4px 12px rgba(0,188,212,.18);
      transform: translateY(-1px);
    }
    .bed-card:disabled { cursor: default; }
    .bed-num {
      position: absolute; top: 6px; left: 6px;
      background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 700;
      padding: 2px 7px; border-radius: 6px;
    }
    .bed-icon { font-size: 32px; color: #94a3b8; }
    .bed-caption {
      font-size: 11.5px; color: #64748b; text-align: center; line-height: 1.3;
      max-width: 100%; word-break: break-word;
    }

    .bed-card.occupied .bed-icon { color: #ec4899; }
    .bed-card.occupied { background: #fef7fb; border-color: #fbcfe8; }
    .bed-card.occupied .bed-caption { color: #831843; font-weight: 600; }

    .bed-card.pending .bed-icon { color: #ec4899; }
    .bed-card.pending { background: #fff8f0; border-color: #fed7aa; }

    .bed-card.maintenance { background: #f8fafc; opacity: .65; }
    .bed-card.maintenance .bed-icon { color: #94a3b8; }

    .bed-pill {
      position: absolute; top: 6px; right: 6px;
      display: inline-flex; align-items: center; gap: 3px;
      background: var(--color-warning, #FB8C00); color: #fff;
      font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 999px;
      box-shadow: 0 2px 4px rgba(251,140,0,.35);
    }
    .bed-pill .material-icons { font-size: 12px; }

    .not-found {
      padding: 80px 20px; text-align: center; color: #64748b;
    }
    .not-found .material-icons { font-size: 56px; color: #cbd5e1; }
    .not-found h2 { margin: 12px 0; color: #0f172a; }
    .back-link { color: var(--color-primary-dark, #0097A7); font-weight: 600; text-decoration: none; }
  `]
})
export class BedManagementPageComponent {
  private route = inject(ActivatedRoute);
  private admissions = inject(AdmissionRequestService);
  private auth = inject(AuthService);
  private store = inject(ServicesStore);

  constructor() { this.store.ensureLoaded(); }

  private serviceId = toSignal(
    this.route.paramMap.pipe(map(p => p.get('serviceId') ?? '')),
    { initialValue: '' }
  );

  service = computed<ServiceConfig | null>(() => {
    const id = this.serviceId();
    return this.store.services().find(s => s.id === id) ?? null;
  });

  private materializeVirtualBeds = effect(() => {
    const s = this.service();
    if (!s) return;
    for (const u of s.units) {
      if (u.rooms.length === 0) {
        this.store.ensureVirtualBed(s.id, u.id);
      }
    }
  });

  totalLits = computed(() => {
    const s = this.service();
    return s ? totalLitsService(s) : 0;
  });

  occupied = computed(() => {
    const s = this.service();
    return s ? litsOccupesService(s) : 0;
  });

  taux = computed(() => {
    const s = this.service();
    return s ? tauxOccupation(s) : 0;
  });

  occColor = computed(() => {
    const t = this.taux();
    if (t >= 90) return '#E53935';
    if (t >= 60) return '#F59E0B';
    return '#22C55E';
  });

  unitesView = computed<UniteView[]>(() => {
    const s = this.service();
    if (!s) return [];
    const reqs = this.admissions.all();

    return s.units.map((u: Unit) => {
      const sallesIn: Room[] = u.rooms.length > 0
        ? u.rooms
        : [{
            id: `${s.id}-${u.id}-virtual`,
            name: 'Salle 1',
            type: 'Chambre',
            capacity: 1,
            beds: [{ id: `${s.id}-${u.id}-virtual-lit-5`, bed_number: 'Lit 05', status: 'free' as const }],
          } as Room];

      const sv: SalleView[] = sallesIn.map((salle: Room) => ({
        salle,
        beds: salle.beds.map<BedView>((lit: Bed) => {
          // AdmissionRequest now keys beds by their numeric backend id
          // (`bedId`). The frontend Bed model still carries a string `id`,
          // so compare loosely until the services-config models migrate.
          const sameBed = (r: { bedId: number | null }) => String(r.bedId ?? '') === String(lit.id);
          const pending = reqs.find(r => sameBed(r) && r.status === 'PENDING') ?? null;
          const validated = reqs.find(r => sameBed(r) && r.status === 'VALIDATED');
          return {
            lit,
            patientName: lit.status === 'occupied'
              ? (validated ? `${validated.nom} ${validated.prenom}` : 'Lit occupé')
              : null,
            pendingReq: pending,
          };
        }),
      }));

      return {
        unite: u,
        salles: sv,
        totalLits: sv.reduce((a, x) => a + x.beds.length, 0),
        occupiedLits: sv.reduce((a, x) => a + x.beds.filter(b => b.lit.status === 'occupied').length, 0),
      };
    });
  });

  formOpen = signal(false);
  formContext = signal<AdmissionFormContext | null>(null);
  private pendingTarget: { unite: Unit; salle: Room; lit: Bed } | null = null;

  get medecin(): string {
    const u = this.auth.currentUser();
    return u?.name ?? 'admin';
  }

  bedNumber(l: Bed): string {
    const m = l.bed_number.match(/(\d+)/);
    return m ? m[1] : l.bed_number;
  }

  onBedClick(unite: Unit, salle: Room, bv: BedView): void {
    if (bv.lit.status !== 'free' || bv.pendingReq) return;
    this.pendingTarget = { unite, salle, lit: bv.lit };
    const svc = this.service()!;
    this.formContext.set({
      serviceNom: svc.name,
      uniteNom: unite.name,
      salleNom: salle.name,
      litNumero: bv.lit.bed_number,
    });
    this.formOpen.set(true);
  }

  onFormSubmit(payload: AdmissionFormPayload): void {
    const t = this.pendingTarget;
    const svc = this.service();
    if (!t || !svc) { this.closeForm(); return; }

    // AdmissionRequest expects real backend numeric ids; the
    // ServicesStore's local Service/Bed models still expose string ids
    // (e.g. 'svc-001-u3-virtual-lit-5'). Coerce optimistically — the
    // backend will reject a forged/non-numeric service_id at validate(),
    // surfacing the mismatch via lastError on the request.
    const numericServiceId = Number(svc.id);
    const numericBedId = Number(t.lit.id);

    this.admissions.add({
      serviceId: Number.isFinite(numericServiceId) ? numericServiceId : 0,
      bedId: Number.isFinite(numericBedId) ? numericBedId : null,
      serviceNom: svc.name,
      uniteId: t.unite.id,
      uniteNom: t.unite.name,
      salleId: t.salle.id,
      salleNom: t.salle.name,
      litNumero: t.lit.bed_number,
      nom: payload.nom,
      prenom: payload.prenom,
      mode: payload.mode,
      gardeMalade: payload.gardeMalade,
      motif: payload.motif,
      medecin: this.medecin,
    });
    this.closeForm();
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.formContext.set(null);
    this.pendingTarget = null;
  }
}
