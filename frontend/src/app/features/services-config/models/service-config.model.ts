export type ServiceType = number;

/** Legacy string-based type labels — used by map components and cards. */
export type ServiceTypeName =
  | 'URGENCE' | 'CHIRURGIE' | 'MEDECINE' | 'CONSULTATION'
  | 'MATERNITE' | 'PEDIATRIE' | 'RADIOLOGIE' | 'LABORATOIRE'
  | 'PHARMACIE' | 'HEMODIALYSE' | 'AUTRE';

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
  type_label?: string;
  chief: User;
  medical_chief: User;
  is_active: boolean;
  units: Unit[];
  coords?: {
    lat: number;
    lon: number;
  };
}

// ── Legacy string-based color maps (used by map & card components) ────────

export const ALL_SERVICE_TYPES: ServiceTypeName[] = [
  'URGENCE','CHIRURGIE','MEDECINE','CONSULTATION',
  'MATERNITE','PEDIATRIE','RADIOLOGIE','LABORATOIRE',
  'PHARMACIE','HEMODIALYSE','AUTRE',
];

export const TYPE_LABEL: Record<ServiceTypeName, string> = {
  URGENCE:      'Urgences',
  CHIRURGIE:    'Chirurgie',
  MEDECINE:     'Médecine',
  CONSULTATION: 'Consultation',
  MATERNITE:    'Maternité',
  PEDIATRIE:    'Pédiatrie',
  RADIOLOGIE:   'Radiologie',
  LABORATOIRE:  'Laboratoire',
  PHARMACIE:    'Pharmacie',
  HEMODIALYSE:  'Hémodialyse',
  AUTRE:        'Autre',
};

export const TYPE_COLOR: Record<string, string> = {
  URGENCE:      '#E53935',
  CHIRURGIE:    '#F57C00',
  MEDECINE:     '#1565C0',
  CONSULTATION: '#BF360C',
  MATERNITE:    '#AD1457',
  PEDIATRIE:    '#00897B',
  RADIOLOGIE:   '#5E35B1',
  LABORATOIRE:  '#00838F',
  PHARMACIE:    '#558B2F',
  HEMODIALYSE:  '#6D4C41',
  AUTRE:        '#546E7A',
};

export const TYPE_FILL: Record<string, string> = {
  URGENCE:      '#FFCDD2',
  CHIRURGIE:    '#FFE0B2',
  MEDECINE:     '#BBDEFB',
  CONSULTATION: '#FBE9E7',
  MATERNITE:    '#F8BBD0',
  PEDIATRIE:    '#B2DFDB',
  RADIOLOGIE:   '#D1C4E9',
  LABORATOIRE:  '#B2EBF2',
  PHARMACIE:    '#DCEDC8',
  HEMODIALYSE:  '#D7CCC8',
  AUTRE:        '#ECEFF1',
};

export const TYPE_STROKE: Record<string, string> = {
  URGENCE:      '#E53935',
  CHIRURGIE:    '#F57C00',
  MEDECINE:     '#1565C0',
  CONSULTATION: '#BF360C',
  MATERNITE:    '#AD1457',
  PEDIATRIE:    '#00897B',
  RADIOLOGIE:   '#5E35B1',
  LABORATOIRE:  '#00838F',
  PHARMACIE:    '#558B2F',
  HEMODIALYSE:  '#6D4C41',
  AUTRE:        '#546E7A',
};

/** Get a color for a numeric service type ID (cycles through a palette). */
const ID_PALETTE = ['#E53935','#F57C00','#1565C0','#BF360C','#AD1457','#00897B','#5E35B1','#00838F','#558B2F','#6D4C41','#546E7A'];

export function typeColorById(id: number): string {
  return ID_PALETTE[(id - 1) % ID_PALETTE.length] ?? '#546E7A';
}

export function typeFillById(id: number): string {
  const fills = ['#FFCDD2','#FFE0B2','#BBDEFB','#FBE9E7','#F8BBD0','#B2DFDB','#D1C4E9','#B2EBF2','#DCEDC8','#D7CCC8','#ECEFF1'];
  return fills[(id - 1) % fills.length] ?? '#ECEFF1';
}

// ── Utility functions ─────────────────────────────────────────────────────

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

export const ALL_UNIT_TYPES: UnitType[] = [
  'Admission Classique','Soins Intensifs','Réanimation',
  'Pédiatrie','Maternité','Chirurgie Ambulatoire','Autre',
];

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
