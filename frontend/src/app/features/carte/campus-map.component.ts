import {
  Component, OnInit, OnDestroy,
  ElementRef, ViewChild, Input, HostBinding,
  signal, computed, inject, effect, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import maplibregl from 'maplibre-gl';
import { OsmService } from '../../core/services/osm.service';
import { ServicesStore } from '../services-config/services-store';
import {
  ServiceConfig, ServiceType, MapServiceStatus,
  TYPE_FILL, TYPE_STROKE, TYPE_LABEL,
  shortLabel, computeStatus, totalLitsService, litsOccupesService
} from '../services-config/models/service-config.model';
import { ServiceMiniCardComponent } from '../../shared/components/service-mini-card/service-mini-card.component';

@Component({
  selector: 'hm-campus-map',
  standalone: true,
  imports: [CommonModule, FormsModule, ServiceMiniCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campus-map.component.html',
  styleUrl: './campus-map.component.scss',
})
export class CampusMapComponent implements OnInit, OnDestroy {
  /** When true, hide the full-page header/sidebar/legend so the host can be
   *  embedded inside another card (e.g. the Super Admin dashboard map widget). */
  @Input() compact = false;

  @HostBinding('class.compact')
  get isCompact(): boolean { return this.compact; }

  @ViewChild('mapContainer', { static: true })
  mapContainer!: ElementRef<HTMLDivElement>;

  private osm = inject(OsmService);
  private servicesStore = inject(ServicesStore);
  private map!: maplibregl.Map;

  constructor() {
    this.servicesStore.ensureLoaded();
    // Re-render map markers whenever the filtered services change
    // (e.g. after async load, search, or filter toggle)
    effect(() => {
      this.filteredSvcs();
      if (this.mapReady()) this.renderMarkers();
    });
  }

  mapReady    = signal(false);
  mapError    = signal('');
  selectedSvc = signal<ServiceConfig | null>(null);
  activeFilter = signal<string>('ALL');
  showLegend  = signal(true);
  searchQuery = signal('');

  readonly allSvcs = this.servicesStore.services;
  readonly allTypes = Object.keys(TYPE_LABEL) as ServiceType[];
  readonly typeLabels = TYPE_LABEL;
  readonly typeFills  = TYPE_FILL;
  readonly typeStrokes = TYPE_STROKE;
  readonly totalLitsService = totalLitsService;
  readonly litsOccupesService = litsOccupesService;
  readonly computeStatus = computeStatus;

  totalBeds     = computed(() => this.allSvcs().reduce((s, r) => s + (totalLitsService(r)), 0));
  occupiedBeds  = computed(() => this.allSvcs().reduce((s, r) => s + (litsOccupesService(r)), 0));
  criticalCount = computed(() => this.allSvcs().filter(r => computeStatus(r) === 'CRITIQUE').length);
  occupancyPct  = computed(() => this.totalBeds() > 0
    ? Math.round((this.occupiedBeds() / this.totalBeds()) * 100) : 0);

  filteredSvcs = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const f = this.activeFilter();
    return this.allSvcs().filter(s => {
      const typeOk = f === 'ALL' || s.type === f;
      const qOk    = !q || s.name.toLowerCase().includes(q) || shortLabel(s.name).toLowerCase().includes(q);
      return typeOk && qOk;
    });
  });

  readonly legendEntries = [
    { type:'URGENCE',        label:'Urgences',       fill:'#FFCDD2', stroke:'#E53935' },
    { type:'CHIRURGIE',      label:'Chirurgie',      fill:'#FFE0B2', stroke:'#F57C00' },
    { type:'MEDECINE',       label:'Médecine',       fill:'#BBDEFB', stroke:'#1565C0' },
    { type:'LABORATOIRE',    label:'Laboratoires',   fill:'#E1BEE7', stroke:'#6A1B9A' },
    { type:'IMAGERIE',       label:'Imagerie',       fill:'#B2EBF2', stroke:'#00838F' },
    { type:'PHARMACIE',      label:'Pharmacie',      fill:'#C8E6C9', stroke:'#2E7D32' },
    { type:'ADMINISTRATION', label:'Administration', fill:'#ECEFF1', stroke:'#546E7A' },
    { type:'LOGISTIQUE',     label:'Logistique',     fill:'#FFF9C4', stroke:'#F9A825' },
    { type:'ENSEIGNEMENT',   label:'Enseignement',   fill:'#E8EAF6', stroke:'#283593' },
  ];

  async ngOnInit(): Promise<void> {
    try {
      this.map = new maplibregl.Map({
        container: this.mapContainer.nativeElement,
        style: 'https://tiles.openfreemap.org/styles/positron',
        center: [6.6168, 36.3734],
        zoom: 16.2,
        bearing: 0,
        pitch: 0,
      });

      this.map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
      this.map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

      this.map.on('load', async () => {
        this.addCampusBoundary();

        const buildings = await this.osm.fetchCampusBuildings();
        if (buildings.length > 0) {
          this.addBuildingFootprints(buildings);
        }

        this.renderMarkers();
        this.mapReady.set(true);
        this.map.resize();
      });

      this.map.on('error', (e) => {
        console.warn('[HealthMap] MapLibre error:', e);
      });

    } catch (err: any) {
      this.mapError.set(err?.message ?? 'Erreur de chargement de la carte');
    }
  }

  private addCampusBoundary(): void {
    this.map.addSource('chu-campus', {
      type: 'geojson',
      data: this.osm.CHU_CAMPUS_GEOJSON,
    });

    this.map.addLayer({
      id: 'chu-campus-fill',
      type: 'fill',
      source: 'chu-campus',
      paint: { 'fill-color': '#FAFAF0', 'fill-opacity': 0.3 },
    });

    this.map.addLayer({
      id: 'chu-campus-border',
      type: 'line',
      source: 'chu-campus',
      paint: { 'line-color': '#E8692A', 'line-width': 3.5, 'line-opacity': 1 },
    });
  }

  private addBuildingFootprints(buildings: any[]): void {
    const fc: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: buildings.map((b: any) => ({
        type: 'Feature' as const,
        properties: { id: b.id, name: b.name, type: b.buildingType },
        geometry: { type: 'Polygon' as const, coordinates: [b.geometry] },
      }))
    };

    this.map.addSource('osm-buildings', { type: 'geojson', data: fc });

    this.map.addLayer({
      id: 'osm-buildings-fill',
      type: 'fill',
      source: 'osm-buildings',
      paint: { 'fill-color': '#D4C8A8', 'fill-opacity': 0.85 },
    });

    this.map.addLayer({
      id: 'osm-buildings-outline',
      type: 'line',
      source: 'osm-buildings',
      paint: { 'line-color': '#A89878', 'line-width': 1 },
    });

    this.map.addLayer({
      id: 'osm-buildings-labels',
      type: 'symbol',
      source: 'osm-buildings',
      filter: ['!=', ['get', 'name'], ''],
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 11,
        'text-anchor': 'center',
        'text-allow-overlap': false,
      },
      paint: {
        'text-color': '#5A4030',
        'text-halo-color': '#FFFFFF',
        'text-halo-width': 2,
      },
    });
  }

  private renderMarkers(): void {
    document.querySelectorAll('.svc-marker-wrapper').forEach(el => el.remove());

    for (const svc of this.filteredSvcs()) {
      const fill   = TYPE_FILL[svc.type]   ?? '#EEE';
      const stroke = TYPE_STROKE[svc.type] ?? '#999';
      const isCritique    = computeStatus(svc) === 'CRITIQUE';
      const isMaintenance = computeStatus(svc) === 'MAINTENANCE';

      const bedText = svc.units && svc.units.length > 0
        ? `<div class="svc-beds">🛏 ${litsOccupesService(svc)}/${totalLitsService(svc)}</div>` : '';

      const critBadge = isCritique
        ? `<div class="svc-critique-dot"></div>` : '';

      const markerHtml = `
        <div class="svc-marker ${isCritique ? 'svc-marker--critique' : ''} ${isMaintenance ? 'svc-marker--maintenance' : ''}"
          style="border-color:${stroke}; background:${fill}">
          ${critBadge}
          <div class="svc-code" style="background:${stroke}">${svc.code}</div>
          <div class="svc-label">${shortLabel(svc.name)}</div>
          ${bedText}
        </div>`;

      const el = document.createElement('div');
      el.innerHTML = markerHtml;
      el.className = 'svc-marker-wrapper';
      el.style.cursor = 'pointer';

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectedSvc.set(svc);
      });

      if (svc.coords?.lon !== undefined && svc.coords?.lat !== undefined) {
        new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([svc.coords.lon, svc.coords.lat])
          .addTo(this.map);
      }
    }
  }

  setFilter(type: string): void {
    this.activeFilter.set(type);
    if (this.mapReady()) {
      this.renderMarkers();
    }
  }

  setSearch(q: string): void {
    this.searchQuery.set(q);
    if (this.mapReady()) {
      this.renderMarkers();
    }
  }

  closePanel(): void { this.selectedSvc.set(null); }

  getBedsPct(svc: ServiceConfig): number {
    const total = totalLitsService(svc);
    if (total === 0) return 0;
    return Math.round((litsOccupesService(svc) / total) * 100);
  }

  getStatusColor(s: MapServiceStatus): string {
    const map: Record<MapServiceStatus, string> = {
      LIBRE: '#C8E6C9', OCCUPE: '#FFF9C4', CRITIQUE: '#FFCDD2', MAINTENANCE: '#EEEEEE'
    };
    return map[s];
  }

  getTypeColor(t: string): string  { return TYPE_FILL[t as ServiceType]   ?? '#EEE'; }
  getTypeStroke(t: string): string { return TYPE_STROKE[t as ServiceType] ?? '#9E9E9E'; }

  flyToService(svc: ServiceConfig): void {
    this.selectedSvc.set(svc);
    if (svc.coords?.lon !== undefined && svc.coords?.lat !== undefined) {
      this.map?.flyTo({ center: [svc.coords.lon, svc.coords.lat], zoom: 17.5, duration: 800 });
    }
  }

  goToServiceDetails(serviceId: string): void {
    // Navigate to service detail page
    // This assumes there's a route for service details
    // Adjust the route as needed based on your application structure
    console.log('Navigate to service details for:', serviceId);
    // Example: this.router.navigate(['/services', serviceId]);
  }

  ngOnDestroy(): void {
    document.querySelectorAll('.svc-marker-wrapper').forEach(el => el.remove());
    this.map?.remove();
  }
}
