import {
  Component, OnInit, signal, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicesStore } from '../services-config/services-store';
import {
  ServiceConfig, ServiceType, computeStatus, totalLitsService, litsOccupesService,
  STATUS_FILL, STATUS_STROKE, TYPE_FILL, TYPE_STROKE, typeColorById, typeFillById,
  MapServiceStatus
} from '../services-config/models/service-config.model';

interface ChuRoom {
  id: string;
  label: string;
  type: string;
  responsable?: string;
  beds?: number;
  bedsOccupied?: number;
  status: MapServiceStatus;
  x: number; y: number; width: number; height: number;
}
type ChuService = any;
const ROOM_TYPE_LABELS: Record<string, string> = {
  CHAMBRE: 'Chambre', BOX: 'Box', BLOC: 'Bloc',
  SALLE_ATTENTE: 'Salle d\'attente', COULOIR: 'Couloir',
  RESERVE: 'Réserve', WC: 'Sanitaires', BUREAU: 'Bureau',
};

// Using imported constants from service-config.model for consistency

@Component({
  selector: 'hm-service-map',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-map.component.html',
  styleUrl: './service-map.component.scss',
})
export class ServiceMapComponent implements OnInit {
  service = signal<ChuService | null>(null);
  selectedRoom = signal<ChuRoom | null>(null);
  hoveredRoom  = signal<ChuRoom | null>(null);

  readonly statusFills   = STATUS_FILL;
  readonly statusStrokes = STATUS_STROKE;
  readonly roomTypeLabels = ROOM_TYPE_LABELS;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: ServicesStore
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('serviceId');
    if (!id) {
      this.service.set(null);
      return;
    }
    // Make sure services are loaded before we look up byId
    await this.store.loadServices();
    const svc = this.store.byId(id);
    if (svc) {
      const convertedService = this.convertServiceConfigToChuService(svc);
      this.service.set(convertedService);
    } else {
      this.service.set(null);
    }
  }

  /**
   * Convert ServiceConfig from services-config to the format expected by the service map template
   */
  private convertServiceConfigToChuService(svc: ServiceConfig): any {
    // Calculate total beds from unites
    const totalBeds = totalLitsService(svc);
    const occupiedBeds = litsOccupesService(svc);
    
    // Create mock rooms data based on units and rooms
    // This is a simplified conversion - in a real app, you'd have proper room data
    const rooms: any[] = [];
    let roomIndex = 0;

    svc.units.forEach((unite: any, uniteIndex: number) => {
      unite.rooms.forEach((salle: any, salleIndex: number) => {
        // Create a room for each room
        rooms.push({
          id: `room-${uniteIndex}-${salleIndex}`,
          label: salle.name,
          type: this.mapSalleTypeToRoomType(salle.type),
          responsable: '', // Not available in ServiceConfig
          beds: salle.capacity,
          bedsOccupied: salle.beds.filter((l: any) => l.status === 'occupied').length,
          status: computeStatus(svc), // Use service status for all rooms (simplified)
          // Mock position and size - in a real app, these would come from actual room data
          x: 50 + (roomIndex * 120),
          y: 50 + (Math.floor(roomIndex / 3) * 100),
          width: 100,
          height: 80
        });
        roomIndex++;
      });
    });
    
    // If no rooms were created, create a default one
    if (rooms.length === 0) {
      rooms.push({
        id: 'room-default',
        label: 'Zone principale',
        type: 'CHAMBRE',
        responsable: '',
        beds: totalBeds,
        bedsOccupied: occupiedBeds,
        status: computeStatus(svc),
        x: 100,
        y: 100,
        width: 200,
        height: 150
      });
    }
    
    return {
      ...svc,
      label: svc.name,
      totalBeds,
      occupiedBeds,
      indoorWidth: 800, // Mock values - in a real app, these would come from actual indoor map data
      indoorHeight: 600,
      floor: 'Rez-de-chaussée', // Mock value
      rooms,
      // Add chef property if it exists
      chef: svc.chief?.name || undefined
    };
  }
  
  /**
   * Map salle type to room type for display purposes
   */
  private mapSalleTypeToRoomType(salleType: string): string {
    // Mapping from salle types to the room types used in the template
    const typeMap: Record<string, string> = {
      'Chambre': 'CHAMBRE',
      'Box': 'BOX',
      'Bloc': 'BLOC',
      'Salle d\'attente': 'SALLE_ATTENTE',
      'Couloir': 'COULOIR',
      'Réserve': 'RESERVE',
      'Sanitaires': 'WC',
      'Bureau': 'BUREAU',
      // Default fallback
      default: 'CHAMBRE'
    };
    
    return typeMap[salleType] || typeMap['default'];
  }

  getRoomFill(r: ChuRoom): string {
    if (r.type === 'COULOIR') return '#E8E8E8';
    return this.statusFills[r.status] ?? '#F5F5F5';
  }

  getRoomStroke(r: ChuRoom): string {
    if (r.type === 'COULOIR') return '#D0D0D0';
    if (this.hoveredRoom()?.id === r.id) return '#212121';
    return this.statusStrokes[r.status] ?? '#9E9E9E';
  }

  getServiceColor(svc: ChuService | ServiceConfig): string {
    const t = svc.type;
    if (typeof t === 'number') return typeFillById(t);
    return TYPE_FILL[t as string] ?? '#F5F5F5';
  }

  getServiceStroke(svc: ChuService | ServiceConfig): string {
    const t = svc.type;
    if (typeof t === 'number') return typeColorById(t);
    return TYPE_STROKE[t as string] ?? '#9E9E9E';
  }

  getStatusColor(status: MapServiceStatus): string {
    return this.statusFills[status] ?? '#EEE';
  }

  getBedsPct(r: ChuRoom): number {
    if (!r.beds) return 0;
    return Math.round(((r.bedsOccupied ?? 0) / r.beds) * 100);
  }

  onRoomClick(r: ChuRoom): void {
    if (r.type === 'COULOIR') return;
    this.selectedRoom.set(this.selectedRoom()?.id === r.id ? null : r);
  }

  goBack(): void {
    this.router.navigate(['/carte']);
  }
}
