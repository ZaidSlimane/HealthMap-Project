import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ServiceConfig, TYPE_COLOR, TYPE_FILL,
  totalLitsService, litsOccupesService, tauxOccupation,
  totalSallesService, computeStatus, STATUS_FILL, STATUS_STROKE,
  shortLabel, MapServiceStatus, ServiceType
} from '../../../features/services-config/models/service-config.model';

@Component({
  selector: 'hm-service-mini-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-mini-card.component.html',
  styleUrl: './service-mini-card.component.scss',
})
export class ServiceMiniCardComponent {
  @Input({ required: true }) service!: ServiceConfig;
  @Output() closed = new EventEmitter<void>();
  @Output() navigateToService = new EventEmitter<string>();

  readonly statusFill = STATUS_FILL;
  readonly statusStroke = STATUS_STROKE;
  readonly typeFillMap = TYPE_FILL;
  readonly typeColorMap = TYPE_COLOR;

  get typeColor(): string { return TYPE_COLOR[this.service.type] ?? '#546E7A'; }
  get typeFill(): string  { return TYPE_FILL[this.service.type] ?? '#ECEFF1'; }
  get lbl(): string       { return shortLabel(this.service.name); }

  get status(): MapServiceStatus { return computeStatus(this.service); }
  get totalLits(): number   { return totalLitsService(this.service); }
  get litsOccupes(): number { return litsOccupesService(this.service); }
  get totalSalles(): number { return totalSallesService(this.service); }
  get taux(): number        { return tauxOccupation(this.service); }
  get totalUnites(): number { return this.service.units.length; }

  get hasGeo(): boolean {
    return this.service.coords?.lon !== undefined && this.service.coords?.lat !== undefined;
  }

  occColor(pct: number): string {
    if (pct >= 90) return '#E53935';
    if (pct >= 60) return '#F59E0B';
    return '#22C55E';
  }

  close(): void { this.closed.emit(); }
  go(): void { this.navigateToService.emit(this.service.id); }
}
