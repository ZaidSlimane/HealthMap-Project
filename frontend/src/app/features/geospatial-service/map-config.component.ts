import {
  Component, OnInit, OnDestroy, ElementRef, ViewChild,
  signal, inject, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import maplibregl from 'maplibre-gl';
import { OsmService } from '../../core/services/osm.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { environment } from '../../../environments/environment';

interface ServiceItem {
  id: number;
  name: string;
  code: string;
  latitude: number | null;
  longitude: number | null;
  service_type_id: number;
  is_active: boolean;
}

@Component({
  selector: 'hm-map-config',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="map-config-page">
      <hm-page-header title="Configuration de la Carte" icon="map"
        subtitle="Associez chaque service à un emplacement sur le campus">
      </hm-page-header>

      <div class="info-banner">
        <span class="material-icons">info</span>
        <span>Sélectionnez un service dans la liste, puis cliquez sur la carte pour associer sa position.</span>
      </div>

      <div class="map-config-layout">
        <!-- Left panel: service list -->
        <aside class="service-list-panel">
          <h3 class="panel-title">Services</h3>
          <div class="service-list">
            @for (svc of services(); track svc.id) {
              <button
                class="service-item"
                [class.selected]="selectedService()?.id === svc.id"
                [class.has-coords]="svc.latitude !== null"
                (click)="selectService(svc)">
                <span class="coord-status">{{ svc.latitude !== null ? '✓' : '✗' }}</span>
                <span class="svc-name">{{ svc.name }}</span>
              </button>
            }
          </div>
        </aside>

        <!-- Right panel: map -->
        <div class="map-panel">
          <div #mapContainer class="map-container"></div>

          <!-- Confirmation dialog -->
          @if (pendingCoords()) {
            <div class="confirm-overlay">
              <div class="confirm-dialog">
                <p class="confirm-text">
                  Associer <strong>{{ selectedService()?.name }}</strong> à cette position ?
                </p>
                <p class="confirm-coords">
                  lat: {{ pendingCoords()!.lat | number:'1.7-7' }}, lon: {{ pendingCoords()!.lon | number:'1.7-7' }}
                </p>
                <div class="confirm-actions">
                  <button class="btn btn-cancel" (click)="cancelAssign()">Annuler</button>
                  <button class="btn btn-confirm" (click)="confirmAssign()" [disabled]="loading()">
                    {{ loading() ? 'Enregistrement...' : 'Confirmer' }}
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-config-page {
      padding: 24px;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .info-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: var(--color-info-bg, #e3f2fd);
      border-radius: var(--radius-md, 10px);
      color: var(--color-info-text, #1565c0);
      font-size: 13px;
      margin-bottom: 16px;
    }

    .info-banner .material-icons {
      font-size: 18px;
    }

    .map-config-layout {
      display: flex;
      gap: 16px;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .service-list-panel {
      width: 300px;
      min-width: 300px;
      display: flex;
      flex-direction: column;
      background: var(--color-surface, #fff);
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--color-border, #e2e8f0);
      overflow: hidden;
    }

    .panel-title {
      margin: 0;
      padding: 14px 16px;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
      border-bottom: 1px solid var(--color-border, #e2e8f0);
    }

    .service-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .service-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 12px;
      border: none;
      background: transparent;
      border-radius: var(--radius-sm, 6px);
      cursor: pointer;
      text-align: left;
      font-size: 13px;
      color: var(--color-text, #0f172a);
      transition: background 0.15s;
    }

    .service-item:hover {
      background: var(--color-hover, #f1f5f9);
    }

    .service-item.selected {
      background: var(--color-primary-light, #e0f7fa);
      font-weight: 600;
    }

    .coord-status {
      font-size: 14px;
      width: 20px;
      text-align: center;
    }

    .service-item.has-coords .coord-status {
      color: #2e7d32;
    }

    .service-item:not(.has-coords) .coord-status {
      color: #c62828;
    }

    .svc-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .map-panel {
      flex: 1;
      position: relative;
      border-radius: var(--radius-md, 10px);
      overflow: hidden;
      border: 1px solid var(--color-border, #e2e8f0);
    }

    .map-container {
      width: 100%;
      height: 100%;
    }

    .confirm-overlay {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
    }

    .confirm-dialog {
      background: var(--color-surface, #fff);
      border-radius: var(--radius-md, 10px);
      padding: 20px 24px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
      min-width: 320px;
      text-align: center;
    }

    .confirm-text {
      margin: 0 0 4px;
      font-size: 14px;
      color: var(--color-text, #0f172a);
    }

    .confirm-coords {
      margin: 0 0 16px;
      font-size: 12px;
      color: var(--color-text-muted, #64748b);
      font-family: monospace;
    }

    .confirm-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
    }

    .btn {
      padding: 8px 20px;
      border-radius: var(--radius-sm, 6px);
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-cancel {
      background: var(--color-border, #e2e8f0);
      color: var(--color-text, #0f172a);
    }

    .btn-confirm {
      background: var(--color-primary, #00bcd4);
      color: #fff;
    }

    .btn-confirm:hover:not(:disabled) {
      opacity: 0.9;
    }
  `]
})
export class MapConfigComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true })
  mapContainer!: ElementRef<HTMLDivElement>;

  private http = inject(HttpClient);
  private osm = inject(OsmService);

  private map!: maplibregl.Map;
  private markers: maplibregl.Marker[] = [];
  private tempMarker: maplibregl.Marker | null = null;

  services = signal<ServiceItem[]>([]);
  selectedService = signal<ServiceItem | null>(null);
  loading = signal(false);
  pendingCoords = signal<{ lat: number; lon: number } | null>(null);

  async ngOnInit(): Promise<void> {
    this.loadServices();
    this.initMap();
  }

  private loadServices(): void {
    this.http.get<{ data: ServiceItem[] }>(`${environment.baseUrl}/clinical-core/services`)
      .subscribe({
        next: (res) => {
          this.services.set(res.data ?? []);
          // Render existing markers after services load
          setTimeout(() => this.renderServiceMarkers(), 500);
        },
        error: (err) => console.error('[MapConfig] Failed to load services:', err)
      });
  }

  private async initMap(): Promise<void> {
    this.map = new maplibregl.Map({
      container: this.mapContainer.nativeElement,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [6.6168, 36.3734],
      zoom: 16.2,
      bearing: 0,
      pitch: 0,
    });

    this.map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    this.map.on('load', async () => {
      this.addCampusBoundary();

      const buildings = await this.osm.fetchCampusBuildings();
      if (buildings.length > 0) {
        this.addBuildingFootprints(buildings);
      }

      this.renderServiceMarkers();
    });

    this.map.on('click', (e) => {
      if (!this.selectedService()) return;

      const lat = e.lngLat.lat;
      const lon = e.lngLat.lng;

      // Show temporary marker
      this.removeTempMarker();
      const el = document.createElement('div');
      el.className = 'temp-pin';
      el.innerHTML = '<span class="material-icons" style="font-size:32px;color:#E53935;">place</span>';

      this.tempMarker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lon, lat])
        .addTo(this.map);

      this.pendingCoords.set({ lat, lon });
    });
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

  private renderServiceMarkers(): void {
    // Remove existing markers
    this.markers.forEach(m => m.remove());
    this.markers = [];

    for (const svc of this.services()) {
      if (svc.latitude === null || svc.longitude === null) continue;

      const el = document.createElement('div');
      el.className = 'svc-config-marker';
      el.innerHTML = `
        <div class="marker-dot"></div>
        <div class="marker-label">${svc.code || svc.name}</div>
      `;

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([svc.longitude, svc.latitude])
        .addTo(this.map);

      this.markers.push(marker);
    }
  }

  selectService(svc: ServiceItem): void {
    this.selectedService.set(svc);
    this.cancelAssign();
  }

  confirmAssign(): void {
    const svc = this.selectedService();
    const coords = this.pendingCoords();
    if (!svc || !coords) return;

    this.loading.set(true);

    this.http.put<any>(
      `${environment.baseUrl}/clinical-core/services/${svc.id}`,
      { latitude: coords.lat, longitude: coords.lon }
    ).subscribe({
      next: () => {
        // Update local state
        this.services.update(list =>
          list.map(s => s.id === svc.id
            ? { ...s, latitude: coords.lat, longitude: coords.lon }
            : s
          )
        );
        this.selectedService.update(s => s ? { ...s, latitude: coords.lat, longitude: coords.lon } : s);
        this.pendingCoords.set(null);
        this.removeTempMarker();
        this.renderServiceMarkers();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[MapConfig] Failed to save coordinates:', err);
        this.loading.set(false);
      }
    });
  }

  cancelAssign(): void {
    this.pendingCoords.set(null);
    this.removeTempMarker();
  }

  private removeTempMarker(): void {
    if (this.tempMarker) {
      this.tempMarker.remove();
      this.tempMarker = null;
    }
  }

  ngOnDestroy(): void {
    this.markers.forEach(m => m.remove());
    this.removeTempMarker();
    this.map?.remove();
  }
}
