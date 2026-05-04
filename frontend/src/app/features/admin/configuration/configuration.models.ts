/**
 * DTOs returned by `/api/clinical-core/*` for the Configuration page.
 *
 * The clinical hierarchy is:
 *
 *     Service  →  EstablishmentUnit  →  Room  →  Bed
 *
 * Every tenant-scoped resource carries `establishment_id`, auto-filled by
 * the backend from the active session — the frontend never sends it.
 */

export interface Paginated<T> {
  current_page: number;
  data: T[];
  per_page: number;
  total: number;
  last_page: number;
}

// ── ServiceType (global reference) ─────────────────────────────────────
export interface ServiceType {
  id: number;
  label: string;
}

/** Unit-type labels used on the form dropdown — match the legacy enum. */
export const UNIT_TYPES: string[] = [
  'Admission Classique',
  'Soins Intensifs',
  'Réanimation',
  'Pédiatrie',
  'Maternité',
  'Chirurgie Ambulatoire',
  'Autre',
];

// ── Service (top of the clinical tree) ─────────────────────────────────
export interface ClinicalService {
  id: number;
  name: string | null;
  code: string | null;
  is_active: boolean;
  service_type_id: number | null;
  chief_id: number | null;
  medical_chief_id: number | null;
  max_duration: number | null;
  establishment_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface ClinicalServiceInput {
  name: string;
  code?: string | null;
  is_active?: boolean;
  service_type_id?: number | null;
  max_duration?: number | null;
  chief_id?: number | null;
  medical_chief_id?: number | null;
}

// ── EstablishmentUnit (child of Service) ───────────────────────────────
export interface EstablishmentUnit {
  id: number;
  service_id: number | null;
  name: string;
  unit_type: string | null;
  establishment_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface EstablishmentUnitInput {
  service_id: number;
  name: string;
  unit_type?: string | null;
}

// ── Room (child of Unit) ───────────────────────────────────────────────
export interface Room {
  id: number;
  establishment_unit_id: number;
  name: string;
  type: string | null;
  capacity: number;
  establishment_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface RoomInput {
  establishment_unit_id: number;
  name: string;
  type?: string | null;
  capacity?: number;
}

// ── Bed (child of Room) ────────────────────────────────────────────────
export type BedStatus = 'free' | 'occupied' | 'maintenance';

export interface Bed {
  id: number;
  room_id: number;
  bed_number: string;
  status: BedStatus;
  establishment_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface BedInput {
  room_id: number;
  bed_number: string;
  status?: BedStatus;
}
