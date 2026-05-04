export type ServiceType =
  | 'URGENCE' | 'CHIRURGIE' | 'MEDECINE' | 'CONSULTATION'
  | 'LABORATOIRE' | 'IMAGERIE' | 'PHARMACIE'
  | 'ADMINISTRATION' | 'LOGISTIQUE' | 'ENSEIGNEMENT';

export type UnitType =
  | 'Admission Classique' | 'Soins Intensifs' | 'Réanimation'
  | 'Pédiatrie' | 'Maternité' | 'Chirurgie Ambulatoire' | 'Autre';

export type BedStatus = 'free' | 'occupied' | 'maintenance';

export interface User {
  id: string;
  name: string;
  first_name: string;
  email: string;
  is_active: boolean;
}

export interface Bed {
  id: string;
  bed_number: string;
  status: BedStatus;
}

export interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  beds: Bed[];
}

export interface Unit {
  id: string;
  name: string;
  unit_type: UnitType;
  rooms: Room[];
}

export interface ServiceConfig {
  id: string;
  name: string;
  type: ServiceType;
  code: string;
  chief: User;
  medical_chief: User;
  is_active: boolean;
  units: Unit[];
  coords?: {
    lat: number;
    lon: number;
  };
}

export function totalLitsUnite(u: Unit): number {
  return u.rooms.reduce((s, r) => s + r.capacity, 0);
}

export function litsOccupesUnite(u: Unit): number {
  return u.rooms.reduce((s, r) => s + r.beds.filter(l => l.status === 'occupied').length, 0);
}

export function totalSallesService(s: ServiceConfig): number {
  return s.units.reduce((a, u) => a + u.rooms.length, 0);
}

export function totalLitsService(s: ServiceConfig): number {
  return s.units.reduce((a, u) => a + totalLitsUnite(u), 0);
}

export function litsOccupesService(s: ServiceConfig): number {
  return s.units.reduce((a, u) => a + litsOccupesUnite(u), 0);
}

export function tauxOccupation(s: ServiceConfig): number {
  const t = totalLitsService(s);
  if (t === 0) return 0;
  return Math.round((litsOccupesService(s) / t) * 100);
}

export function initials(name: string): string {
  return name.replace(/^(Pr\.|Dr\.|Mme|M\.)\s*/i, '')
    .split(' ').filter(Boolean).slice(0, 2)
    .map(w => w[0].toUpperCase()).join('');
}

export type MapServiceStatus = 'LIBRE' | 'OCCUPE' | 'CRITIQUE' | 'MAINTENANCE';

export const ALL_SERVICE_TYPES: ServiceType[] = [
  'URGENCE','CHIRURGIE','MEDECINE','CONSULTATION',
  'LABORATOIRE','IMAGERIE','PHARMACIE',
  'ADMINISTRATION','LOGISTIQUE','ENSEIGNEMENT',
];

export const ALL_UNIT_TYPES: UnitType[] = [
  'Admission Classique','Soins Intensifs','Réanimation',
  'Pédiatrie','Maternité','Chirurgie Ambulatoire','Autre',
];

export const TYPE_COLOR: Record<ServiceType, string> = {
  URGENCE:'#E53935', CHIRURGIE:'#F57C00', MEDECINE:'#1565C0', CONSULTATION:'#BF360C',
  LABORATOIRE:'#6A1B9A', IMAGERIE:'#00838F', PHARMACIE:'#2E7D32',
  ADMINISTRATION:'#546E7A', LOGISTIQUE:'#F9A825', ENSEIGNEMENT:'#283593',
};

export const TYPE_FILL: Record<ServiceType, string> = {
  URGENCE:'#FFCDD2', CHIRURGIE:'#FFE0B2', MEDECINE:'#BBDEFB', CONSULTATION:'#FBE9E7',
  LABORATOIRE:'#E1BEE7', IMAGERIE:'#B2EBF2', PHARMACIE:'#C8E6C9',
  ADMINISTRATION:'#ECEFF1', LOGISTIQUE:'#FFF9C4', ENSEIGNEMENT:'#E8EAF6',
};

export const TYPE_STROKE: Record<ServiceType, string> = { ...TYPE_COLOR };

export const TYPE_LABEL: Record<ServiceType, string> = {
  URGENCE:'Urgences', CHIRURGIE:'Chirurgie', MEDECINE:'Médecine', CONSULTATION:'Consultations',
  LABORATOIRE:'Laboratoires', IMAGERIE:'Imagerie', PHARMACIE:'Pharmacie',
  ADMINISTRATION:'Administration', LOGISTIQUE:'Logistique', ENSEIGNEMENT:'Enseignement',
};

export const STATUS_FILL: Record<MapServiceStatus, string> = {
  LIBRE:'#C8E6C9', OCCUPE:'#FFE0B2', CRITIQUE:'#FFCDD2', MAINTENANCE:'#ECEFF1',
};
export const STATUS_STROKE: Record<MapServiceStatus, string> = {
  LIBRE:'#2E7D32', OCCUPE:'#F57C00', CRITIQUE:'#E53935', MAINTENANCE:'#546E7A',
};

export function shortLabel(name: string): string {
  if (!name) return '';
  return name.length > 18 ? name.slice(0, 16) + '…' : name;
}

export function computeStatus(s: ServiceConfig): MapServiceStatus {
  const total = totalLitsService(s);
  if (total === 0) return 'LIBRE';
  const pct = litsOccupesService(s) / total;
  if (pct >= 1) return 'CRITIQUE';
  if (pct >= 0.6) return 'OCCUPE';
  return 'LIBRE';
}
