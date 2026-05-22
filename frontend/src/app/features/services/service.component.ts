import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner.component';
import { environment } from '../../../environments/environment';

interface Bed {
  id: number;
  bed_number: string;
  status: string;
}

interface Room {
  id: number;
  name: string;
  capacity: number;
  beds: Bed[];
}

interface Unit {
  id: number;
  name: string;
  rooms: Room[];
}

interface AdmittedPatient {
  id: number;
  patient_name: string;
  bed_number: string;
  unit_name: string;
  date_admission: string;
  motif: string;
  is_new: boolean;
}

@Component({
  selector: 'app-service',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hm-page-header
      [title]="serviceName()"
      subtitle="Gestion des lits et admissions"
      icon="local_hospital">
    </hm-page-header>

    @if (loading()) {
      <hm-spinner label="Chargement du service..." />
    } @else {
      <div class="service-layout">
        <!-- LEFT: Admitted patients list -->
        <div class="patients-panel">
          <div class="panel-header">
            <span class="material-icons">people</span>
            <span class="panel-title">Patients admis</span>
            <span class="badge-count">{{ admittedPatients().length }}</span>
          </div>
          <div class="patients-list">
            @for (patient of admittedPatients(); track patient.id) {
              <div class="patient-row" [class.patient-new]="patient.is_new" (click)="openResume(patient.id)">
                @if (patient.is_new) {
                  <span class="new-badge">NOUVEAU</span>
                }
                <div class="patient-name">{{ patient.patient_name }}</div>
                <div class="patient-meta">
                  <span>{{ patient.bed_number }} · {{ patient.unit_name }}</span>
                </div>
              </div>
            } @empty {
              <div class="empty-patients">
                <span class="material-icons">hotel</span>
                <p>Aucun patient admis</p>
              </div>
            }
          </div>
        </div>

        <!-- RIGHT: Bed grid -->
        <div class="beds-panel">
          @for (unit of units(); track unit.id) {
            <div class="unit-card">
              <div class="unit-header">
                <span class="material-icons">apartment</span>
                <span class="unit-name">{{ unit.name }}</span>
                <span class="unit-stats">{{ getOccupiedCount(unit) }}/{{ getTotalBeds(unit) }} occupés</span>
              </div>

              @for (room of unit.rooms; track room.id) {
                <div class="room-section">
                  <div class="room-header">
                    <span class="material-icons room-icon">meeting_room</span>
                    <span class="room-name">{{ room.name }}</span>
                    <span class="room-capacity">({{ room.beds.length }} lits)</span>
                  </div>

                  <div class="beds-grid">
                    @for (bed of room.beds; track bed.id) {
                      <div class="bed-card"
                        [class.bed-free]="bed.status === 'free'"
                        [class.bed-occupied]="bed.status === 'occupied'"
                        [class.bed-clickable]="bed.status === 'occupied'"
                        (click)="bed.status === 'occupied' && openBedDossier(bed.id)">
                        @if (bed.status === 'occupied' && isNewAdmission(bed.id)) {
                          <div class="bed-notification">Nouvelle admission</div>
                        }
                        <div class="bed-content">
                          <div class="bed-icon">
                            <span class="material-icons">{{ bed.status === 'occupied' ? 'hotel' : 'single_bed' }}</span>
                          </div>
                          <div class="bed-info">
                            <span class="bed-number">{{ bed.bed_number }}</span>
                            @if (bed.status === 'occupied') {
                              <span class="bed-patient">{{ getPatientForBed(bed.id) }}</span>
                            } @else {
                              <span class="bed-status-label">Libre</span>
                            }
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          } @empty {
            <div class="empty-state">
              <span class="material-icons">info</span>
              <p>Aucune unité configurée pour ce service.</p>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .service-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 20px;
      align-items: start;
    }

    @media (max-width: 1000px) {
      .service-layout { grid-template-columns: 1fr; }
    }

    /* === Patients panel === */
    .patients-panel {
      background: var(--color-surface, #fff);
      border-radius: var(--radius-lg, 14px);
      border: 1px solid var(--color-border, #e2e8f0);
      overflow: hidden;
      position: sticky;
      top: 20px;
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 16px;
      background: var(--color-surface-alt, #f8fafc);
      border-bottom: 1px solid var(--color-border, #e2e8f0);
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
    }

    .panel-header .material-icons {
      font-size: 20px;
      color: var(--color-primary, #00BCD4);
    }

    .panel-title { flex: 1; }

    .badge-count {
      min-width: 24px;
      height: 20px;
      padding: 0 6px;
      border-radius: 10px;
      background: var(--color-primary, #00BCD4);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .patients-list {
      max-height: 500px;
      overflow-y: auto;
    }

    .patient-row {
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border, #e2e8f0);
      cursor: pointer;
      transition: background 0.15s;
      position: relative;
    }

    .patient-row:hover { background: var(--color-surface-alt, #f8fafc); }
    .patient-row:last-child { border-bottom: none; }

    .patient-row.patient-new {
      background: #eff6ff;
      border-left: 3px solid #2563eb;
    }

    .new-badge {
      position: absolute;
      top: 6px;
      right: 8px;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background: #2563eb;
      color: #fff;
      letter-spacing: 0.05em;
    }

    .patient-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
      margin-bottom: 2px;
    }

    .patient-meta {
      font-size: 11px;
      color: var(--color-text-muted, #64748b);
    }

    .empty-patients {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px;
      color: var(--color-text-muted, #64748b);
    }

    .empty-patients .material-icons { font-size: 32px; opacity: 0.4; margin-bottom: 8px; }
    .empty-patients p { margin: 0; font-size: 13px; }

    /* === Beds panel === */
    .beds-panel {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .unit-card {
      background: var(--color-surface, #fff);
      border-radius: var(--radius-lg, 14px);
      border: 1px solid var(--color-border, #e2e8f0);
      overflow: hidden;
    }

    .unit-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 18px;
      background: var(--color-surface-alt, #f8fafc);
      border-bottom: 1px solid var(--color-border, #e2e8f0);
    }

    .unit-header .material-icons { font-size: 22px; color: var(--color-primary, #00BCD4); }
    .unit-name { font-size: 15px; font-weight: 600; color: var(--color-text, #0f172a); flex: 1; }
    .unit-stats { font-size: 12px; color: var(--color-text-muted, #64748b); }

    .room-section { padding: 14px 18px; border-bottom: 1px solid var(--color-border, #e2e8f0); }
    .room-section:last-child { border-bottom: none; }

    .room-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .room-icon { font-size: 18px; color: var(--color-text-muted, #64748b); }
    .room-name { font-size: 13px; font-weight: 600; color: var(--color-text, #0f172a); }
    .room-capacity { font-size: 12px; color: var(--color-text-muted, #64748b); }

    .beds-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 10px;
    }

    .bed-card {
      border-radius: var(--radius-sm, 6px);
      border: 1px solid var(--color-border, #e2e8f0);
      overflow: hidden;
      transition: all 0.2s ease;
    }

    .bed-card.bed-clickable {
      cursor: pointer;
    }

    .bed-card.bed-clickable:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #f87171;
    }

    .bed-free { background: #f0fdf4; border-color: #bbf7d0; }
    .bed-occupied { background: #fef2f2; border-color: #fecaca; }

    .bed-notification {
      padding: 3px 8px;
      background: #2563eb;
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      text-align: center;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .bed-content {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
    }

    .bed-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
    }

    .bed-free .bed-icon { background: #dcfce7; color: #16a34a; }
    .bed-occupied .bed-icon { background: #fee2e2; color: #dc2626; }
    .bed-icon .material-icons { font-size: 16px; }

    .bed-info { display: flex; flex-direction: column; min-width: 0; }
    .bed-number { font-size: 12px; font-weight: 600; color: var(--color-text, #0f172a); }
    .bed-patient { font-size: 10px; color: #dc2626; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bed-status-label { font-size: 10px; color: #16a34a; font-weight: 500; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 60px 16px;
      color: var(--color-text-muted, #64748b);
    }

    .empty-state .material-icons { font-size: 40px; opacity: 0.4; }
    .empty-state p { margin: 0; font-size: 14px; }
  `]
})
export class ServiceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  readonly serviceName = signal('');
  readonly units = signal<Unit[]>([]);
  readonly admittedPatients = signal<AdmittedPatient[]>([]);
  readonly loading = signal(true);
  readonly newAdmissionBedIds = signal<Set<number>>(new Set());

  private bedPatientMap = new Map<number, string>();
  private bedAdmissionMap = new Map<number, number>();
  private viewedAdmissions = new Set<number>();

  private readonly VIEWED_KEY = 'healthmap_viewed_admissions';

  ngOnInit(): void {
    this.loadViewedAdmissions();
    const serviceId = Number(this.route.snapshot.paramMap.get('serviceId'));
    if (serviceId) {
      this.loadService(serviceId);
      this.loadAdmissions(serviceId);
    }
  }

  getOccupiedCount(unit: Unit): number {
    return unit.rooms.reduce((sum, room) => sum + room.beds.filter(b => b.status === 'occupied').length, 0);
  }

  getTotalBeds(unit: Unit): number {
    return unit.rooms.reduce((sum, room) => sum + room.beds.length, 0);
  }

  isNewAdmission(bedId: number): boolean {
    return this.newAdmissionBedIds().has(bedId);
  }

  getPatientForBed(bedId: number): string {
    return this.bedPatientMap.get(bedId) || 'Occupé';
  }

  openBedDossier(bedId: number): void {
    const admissionId = this.bedAdmissionMap.get(bedId);
    if (admissionId) {
      this.markAsViewed(admissionId, bedId);
      this.openResume(admissionId);
    }
  }

  openResume(admissionId: number): void {
    this.markAsViewed(admissionId);
    const serviceId = this.route.snapshot.paramMap.get('serviceId');
    this.router.navigate(['/services', serviceId, 'admission', admissionId]);
  }

  private markAsViewed(admissionId: number, bedId?: number): void {
    this.viewedAdmissions.add(admissionId);
    this.saveViewedAdmissions();

    // Remove the "new" tag from the bed card reactively
    if (bedId) {
      this.newAdmissionBedIds.update(set => {
        const newSet = new Set(set);
        newSet.delete(bedId);
        return newSet;
      });
    } else {
      // Find the bed for this admission and remove it
      for (const [bId, aId] of this.bedAdmissionMap.entries()) {
        if (aId === admissionId) {
          this.newAdmissionBedIds.update(set => {
            const newSet = new Set(set);
            newSet.delete(bId);
            return newSet;
          });
          break;
        }
      }
    }

    // Update the patient list to remove the "new" flag
    this.admittedPatients.update(patients =>
      patients.map(p => p.id === admissionId ? { ...p, is_new: false } : p)
    );
  }

  private loadViewedAdmissions(): void {
    try {
      const stored = localStorage.getItem(this.VIEWED_KEY);
      if (stored) {
        const ids: number[] = JSON.parse(stored);
        ids.forEach(id => this.viewedAdmissions.add(id));
      }
    } catch { /* ignore parse errors */ }
  }

  private saveViewedAdmissions(): void {
    try {
      localStorage.setItem(this.VIEWED_KEY, JSON.stringify([...this.viewedAdmissions]));
    } catch { /* ignore storage errors */ }
  }

  private loadService(serviceId: number): void {
    this.loading.set(true);
    this.http.get<any>(`${environment.baseUrl}/clinical-core/services/${serviceId}`).subscribe({
      next: (service) => {
        this.serviceName.set(service.name || `Service #${serviceId}`);
        const units: Unit[] = (service.units || []).map((u: any) => ({
          id: u.id,
          name: u.name,
          rooms: (u.rooms || []).map((r: any) => ({
            id: r.id,
            name: r.name,
            capacity: r.capacity || r.beds?.length || 0,
            beds: (r.beds || []).map((b: any) => ({
              id: b.id,
              bed_number: b.bed_number,
              status: b.status || 'free',
            })),
          })),
        }));
        this.units.set(units);
        this.loading.set(false);
      },
      error: () => {
        this.serviceName.set('Service');
        this.loading.set(false);
      }
    });
  }

  private loadAdmissions(serviceId: number): void {
    this.http.get<any>(`${environment.baseUrl}/clinical-core/admissions`, {
      params: { service_id: serviceId, status: 'active' }
    }).subscribe({
      next: (res) => {
        const data = res.data ?? res;
        const now = new Date();
        const newBedIds = new Set<number>();
        const patients: AdmittedPatient[] = (Array.isArray(data) ? data : []).map((a: any) => {
          const admDate = new Date(a.date_admission);
          const hoursSince = (now.getTime() - admDate.getTime()) / (1000 * 60 * 60);
          const isNew = hoursSince < 24 && !this.viewedAdmissions.has(a.id);

          if (a.bed_id) {
            this.bedPatientMap.set(a.bed_id, `${a.patient?.name || ''} ${a.patient?.first_name || ''}`);
            this.bedAdmissionMap.set(a.bed_id, a.id);
            if (isNew) newBedIds.add(a.bed_id);
          }

          return {
            id: a.id,
            patient_name: `${a.patient?.name || ''} ${a.patient?.first_name || ''}`.trim(),
            bed_number: a.bed?.bed_number || '—',
            unit_name: a.bed?.room?.unit?.name || a.bed?.room?.establishment_unit?.name || '—',
            date_admission: a.date_admission,
            motif: a.motif_admission || '—',
            is_new: isNew,
          };
        });
        this.newAdmissionBedIds.set(newBedIds);
        this.admittedPatients.set(patients);
      }
    });
  }
}
