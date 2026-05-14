import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, computed, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ServiceConfig, ServiceType, TYPE_COLOR, typeColorById,
  totalLitsService, litsOccupesService, tauxOccupation,
  totalSallesService, initials
} from '../../models/service-config.model';

@Component({
  selector: 'hm-service-card',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-card.component.html',
  styleUrl: './service-card.component.scss',
})
export class ServiceCardComponent {
  @Input({ required: true }) service!: ServiceConfig;
  @Input() userRole: 'superadmin' | 'admin' | 'medecin' = 'admin';

  @Output() editClicked   = new EventEmitter<ServiceConfig>();
  @Output() litsClicked   = new EventEmitter<ServiceConfig>();
  @Output() deleteClicked = new EventEmitter<string>();

  get typeColor(): string {
    const t = this.service.type;
    return typeof t === 'number' ? typeColorById(t) : (TYPE_COLOR[t] ?? '#546E7A');
  }
  get svcInitials(): string  { return initials(this.service.chief?.name ?? 'Unknown'); }
  get totalUnites(): number  { return this.service.units.length; }
  get totalSalles(): number  { return totalSallesService(this.service); }
  get totalLits(): number    { return totalLitsService(this.service); }
  get litsOccupes(): number  { return litsOccupesService(this.service); }
  get taux(): number         { return tauxOccupation(this.service); }

  get canEdit():   boolean { return ['superadmin','admin'].includes(this.userRole); }
  get canDelete(): boolean { return this.userRole === 'superadmin'; }

  occColor(pct: number): string {
    if (pct >= 90) return '#E53935';
    if (pct >= 60) return '#F59E0B';
    return '#22C55E';
  }
}
