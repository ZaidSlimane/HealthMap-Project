export type ServiceStatus = 'LIBRE' | 'OCCUPE' | 'CRITIQUE' | 'MAINTENANCE';

export type ServiceType =
  | 'URGENCE' | 'CHIRURGIE' | 'MEDECINE' | 'CONSULTATION'
  | 'LABORATOIRE' | 'IMAGERIE' | 'PHARMACIE' | 'ADMINISTRATION'
  | 'LOGISTIQUE' | 'ENSEIGNEMENT';

export type RoomType =
  | 'CHAMBRE' | 'BOX' | 'BLOC' | 'BUREAU'
  | 'SALLE_ATTENTE' | 'COULOIR' | 'RESERVE' | 'WC';

export interface ChuRoom {
  id: string;
  label: string;
  type: RoomType;
  status: ServiceStatus;
  x: number;
  y: number;
  width: number;
  height: number;
  beds?: number;
  bedsOccupied?: number;
  responsable?: string;
}

export interface ChuService {
  id: string;
  code: number;
  label: string;
  shortLabel: string;
  type: ServiceType;
  floor: number;
  hasIndoorMap: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  totalBeds: number;
  occupiedBeds: number;
  status: ServiceStatus;
  chef?: string;
  indoorWidth?: number;
  indoorHeight?: number;
  rooms: ChuRoom[];
}
