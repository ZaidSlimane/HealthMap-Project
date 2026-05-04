import {
  Component, OnInit, OnDestroy,
  ElementRef, ViewChild,
  signal, computed, ChangeDetectionStrategy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  getMapData, show3dMap,
  MapView, Space
} from '@mappedin/mappedin-js';
import '@mappedin/mappedin-js/lib/esm/index.css';
import {
  CHU_CAMPUS_GEOJSON,
  CHU_SERVICE_ZONES,
  SPACE_TO_CHU_SERVICE,
} from '../../core/data/chu-geojson.data';
import { ServicesStore } from '../services-config/services-store';
import { ServiceCardComponent } from '../services-config/components/service-card/service-card.component';
import { ServiceConfig } from '../services-config/models/service-config.model';

type ServiceStatus = 'LIBRE' | 'OCCUPE' | 'CRITIQUE' | 'MAINTENANCE';

const STATUS_FILLS: Record<ServiceStatus, string> = {
  LIBRE:       '#C8E6C9',
  OCCUPE:      '#FFF9C4',
  CRITIQUE:    '#FFCDD2',
  MAINTENANCE: '#EEEEEE',
};

const TYPE_FILLS: Record<string, string> = {
  URGENCE:        '#FFCDD2',
  CHIRURGIE:      '#FFE0B2',
  MEDECINE:       '#BBDEFB',
  LABORATOIRE:    '#E1BEE7',
  IMAGERIE:       '#B2EBF2',
  PHARMACIE:      '#C8E6C9',
  ADMINISTRATION: '#ECEFF1',
  LOGISTIQUE:     '#FFF9C4',
  ACCUEIL:        '#F3E5F5',
};

const TYPE_STROKES: Record<string, string> = {
  URGENCE:        '#E53935',
  CHIRURGIE:      '#F57C00',
  MEDECINE:       '#1565C0',
  LABORATOIRE:    '#6A1B9A',
  IMAGERIE:       '#00838F',
  PHARMACIE:      '#2E7D32',
  ADMINISTRATION: '#546E7A',
  LOGISTIQUE:     '#F9A825',
  ACCUEIL:        '#7B1FA2',
};

@Component({
  selector: 'hm-carte',
  standalone: true,
  imports: [CommonModule, ServiceCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './carte.component.html',
  styleUrl: './carte.component.scss',
})
export class CarteComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true })
  mapContainer!: ElementRef<HTMLDivElement>;

  private servicesStore = inject(ServicesStore); // Inject store

  private mapView: MapView | null = null;
  private allSpaces: Space[] = [];

  mapReady    = signal(false);
  mapError    = signal('');
  selectedSvc = signal<ServiceConfig | null>(null);
  showLegend  = signal(true);

  // Computed total beds based on the Store's services
  totalBeds     = computed(() => this.servicesStore.services().reduce((s, r) => s + (r.unites?.reduce((acc, u) => acc + (u.salles?.reduce((sacc, sa) => sacc + (sa.capacite ?? 0), 0) ?? 0), 0) ?? 0), 0));
  occupiedBeds  = computed(() => this.servicesStore.services().reduce((s, r) => s + (r.unites?.reduce((acc, u) => acc + (u.salles?.reduce((sacc, sa) => sacc + (sa.lits?.filter(l => l.statut === 'OCCUPE').length ?? 0), 0) ?? 0), 0) ?? 0), 0));
  criticalCount = computed(() => this.servicesStore.services().filter(r => r.actif === false).length);
  occupancyPct  = computed(() =>
    this.totalBeds() > 0
      ? Math.round((this.occupiedBeds() / this.totalBeds()) * 100)
      : 0);

  readonly legendEntries = [
    { type: 'URGENCE',        label: 'Urgences',       fill: '#FFCDD2', stroke: '#E53935' },
    { type: 'CHIRURGIE',      label: 'Chirurgie',      fill: '#FFE0B2', stroke: '#F57C00' },
    { type: 'MEDECINE',       label: 'Médecine',       fill: '#BBDEFB', stroke: '#1565C0' },
    { type: 'LABORATOIRE',    label: 'Laboratoires',   fill: '#E1BEE7', stroke: '#6A1B9A' },
    { type: 'IMAGERIE',       label: 'Imagerie',       fill: '#B2EBF2', stroke: '#00838F' },
    { type: 'PHARMACIE',      label: 'Pharmacie',      fill: '#C8E6C9', stroke: '#2E7D32' },
    { type: 'ADMINISTRATION', label: 'Administration', fill: '#ECEFF1', stroke: '#546E7A' },
    { type: 'LOGISTIQUE',     label: 'Logistique',     fill: '#FFF9C4', stroke: '#F9A825' },
  ];

  getBedsPct(svc: SelectedService): number {
    if (!svc.beds) return 0;
    return Math.round(((svc.bedsOccupied ?? 0) / svc.beds) * 100);
  }

  getStatusColor(status: string): string {
    return STATUS_FILLS[status as ServiceStatus] ?? '#EEE';
  }

  getTypeColor(type: string): string {
    return TYPE_FILLS[type] ?? '#ECEFF1';
  }

  async ngOnInit(): Promise<void> {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) {
      this.mapError.set('Rendu 3D indisponible — veuillez utiliser Chrome, Firefox ou Edge avec WebGL activé.');
      return;
    }

    try {
      const mapData = await getMapData({
        key:    'mik_yeBk0Vf0nNJtpesfu560e07e5',
        secret: 'mis_2g9ST8ZcSFb5R9fPnsvYhrX3RyRwPtDGbMGweCYKEq385431022',
        mapId:  '66686f1af06f04000b18b8fa',
      });

      this.mapView = await show3dMap(
        this.mapContainer.nativeElement,
        mapData,
        {
          backgroundColor: '#E8F0E8',
          outdoorView: {
            enabled: true,
            style: 'https://tiles.mappedin.com/styles/mappedin-outdoors/style.json',
          },
        } as any
      );

      this.allSpaces = mapData.getByType('space') as Space[];

      // Dev helper: expose space names for easy SPACE_TO_CHU_SERVICE expansion
      const spaceNames = this.allSpaces.map((s: any) => s.name ?? 'unnamed');
      console.log('[HealthMap] Map spaces:', JSON.stringify(spaceNames, null, 2));
      (window as any).__CHU_SPACES = spaceNames;

      this.applyServiceColors(this.allSpaces);
      this.addServiceLabels(this.allSpaces);
      this.addCampusBoundary();
      this.bindClicks(this.allSpaces);

      this.mapReady.set(true);

    } catch (err: any) {
      this.mapError.set(`Impossible de charger la carte : ${err?.message ?? 'Erreur réseau'}`);
    }
  }

  private applyServiceColors(spaces: Space[]): void {
    if (!this.mapView) return;

    for (const space of spaces) {
      const name = (space as any).name ?? '';
      const svcId = SPACE_TO_CHU_SERVICE[name];
      const svc = svcId ? this.servicesStore.byId(svcId) : null;

      if (svc) {
        const fill   = TYPE_FILLS[svc.type]  ?? '#F5F5F5';
        const stroke = TYPE_STROKES[svc.type] ?? '#9E9E9E';

        this.mapView.updateState(space, {
          interactive: true,
          color: fill,
          opacity: 0.85,
          borderColor: stroke,
          borderWidth: 2,
          borderVisible: true,
        });
      } else {
        this.mapView.updateState(space, {
          interactive: true,
          color: '#F5F5F5',
          opacity: 0.4,
        });
      }
    }
  }

  private addServiceLabels(spaces: Space[]): void {
    if (!this.mapView) return;

    for (const space of spaces) {
      const name = (space as any).name ?? '';
      const svcId = SPACE_TO_CHU_SERVICE[name];
      const svc = svcId ? this.servicesStore.byId(svcId) : null;
      if (!svc) continue;

      // Calculate beds for label
      const totalBeds = svc.unites?.reduce((acc, u) => acc + (u.salles?.reduce((sacc, sa) => sacc + (sa.capacite ?? 0), 0) ?? 0), 0) ?? 0;
      const occBeds = svc.unites?.reduce((acc, u) => acc + (u.salles?.reduce((sacc, sa) => sacc + (sa.lits?.filter(l => l.statut === 'OCCUPE').length ?? 0), 0) ?? 0), 0) ?? 0;
      const bedText = totalBeds > 0 ? `\n🛏 ${occBeds}/${totalBeds}` : '';
      const critBadge = svc.actif === false ? '🔴 ' : '';

      this.mapView.Labels.add(
        space,
        `${critBadge}${svc.nom}${bedText}`,
        {
          appearance: {
            text: {
              foregroundColor: TYPE_STROKES[svc.type] ?? '#37474F',
              size: 11,
              bold: svc.actif === false,
            },
            marker: {
              foregroundColor: { active: TYPE_FILLS[svc.type] ?? '#FFF' },
              backgroundColor: { active: '#FFFFFF' },
            },
          },
        }
      );
    }
  }

  private addCampusBoundary(): void {
    if (!this.mapView) return;

    try {
      const mv = this.mapView as any;
      const ml = mv.maplibre ?? mv._maplibre ?? mv.getMapLibreMap?.() ?? mv._renderer?.map ?? null;

      if (!ml) {
        console.warn('[HealthMap] MapLibre instance not accessible — outdoor GeoJSON layers skipped');
        return;
      }

      const addLayers = () => {
        if (ml.getSource('chu-zones')) return; // idempotent

        ml.addSource('chu-zones', { type: 'geojson', data: CHU_SERVICE_ZONES });
        ml.addLayer({ id: 'chu-zones-fill',   type: 'fill',   source: 'chu-zones',
          paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.35 } });
        ml.addLayer({ id: 'chu-zones-stroke', type: 'line',   source: 'chu-zones',
          paint: { 'line-color': ['get', 'strokeColor'], 'line-width': 1.5, 'line-dasharray': [3, 2] } });
        ml.addLayer({ id: 'chu-zones-labels', type: 'symbol', source: 'chu-zones',
          layout: { 'text-field': ['get', 'label'], 'text-size': 11,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-anchor': 'center', 'text-allow-overlap': false },
          paint: { 'text-color': ['get', 'strokeColor'], 'text-halo-color': '#FFF', 'text-halo-width': 2 } });

        ml.addSource('chu-campus', { type: 'geojson', data: CHU_CAMPUS_GEOJSON });
        ml.addLayer({ id: 'chu-campus-fill',   type: 'fill', source: 'chu-campus',
          paint: { 'fill-color': '#F8F6F0', 'fill-opacity': 0.2 } });
        ml.addLayer({ id: 'chu-campus-border', type: 'line', source: 'chu-campus',
          paint: { 'line-color': '#455A64', 'line-width': 3, 'line-opacity': 0.9 } });

        ml.addSource('chu-label-point', {
          type: 'geojson',
          data: { type: 'Feature', properties: { name: 'CHU IBN BADIS\nCONSTANTINE' },
            geometry: { type: 'Point', coordinates: [6.6168, 36.3734] } }
        });
        ml.addLayer({ id: 'chu-campus-label', type: 'symbol', source: 'chu-label-point',
          layout: { 'text-field': ['get', 'name'], 'text-size': 14,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-anchor': 'center', 'text-allow-overlap': true },
          paint: { 'text-color': '#1A237E', 'text-halo-color': '#FFF', 'text-halo-width': 3 } });
      };

      if (ml.isStyleLoaded?.()) {
        addLayers();
      } else {
        ml.on?.('load', addLayers);
        ml.on?.('style.load', addLayers);
      }
    } catch (e) {
      console.warn('[HealthMap] Outdoor layer error (non-critical):', e);
    }
  }

  private bindClicks(spaces: Space[]): void {
    if (!this.mapView) return;

    this.mapView.on('click', (event: any) => {
      const clicked: Space[] = event?.spaces ?? [];
      if (!clicked.length) {
        this.selectedSvc.set(null);
        this.applyServiceColors(spaces);
        return;
      }

      const space = clicked[0];
      const name  = (space as any).name ?? '';
      const svcId = SPACE_TO_CHU_SERVICE[name];
      const svc   = svcId ? this.servicesStore.byId(svcId) : null;

      this.applyServiceColors(spaces);
      this.mapView!.updateState(space, {
        color: '#FFF9C4',
        borderColor: '#F57F17',
        borderWidth: 4,
        borderVisible: true,
      });

      if (svc) {
        this.selectedSvc.set(svc);
      } else {
        this.selectedSvc.set(null);
      }
    });
  }

  ngOnDestroy(): void {
    (this.mapView as any)?.destroy?.();
  }
}
