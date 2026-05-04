/**
 * DTOs returned by the onboarding endpoints. Replaces the hardcoded
 * `establishments.data.ts` / `wilayas.data.ts` directories — those are now
 * seeded server-side and fetched via /api/onboarding/*.
 */

export interface Wilaya {
  id: number;
  code: number;
  name: string;
}

export interface EstablishmentType {
  id: number;
  /** Stable string code (e.g. "CHU", "EPH") that the wizard sends back. */
  code: string;
  /** Long-form French label shown to the user. */
  label: string;
}

export interface Establishment {
  id: number;
  slug: string;
  name: string;
  name_ar: string | null;
  establishment_type_id: number;
  province_id: number;
  source: 'seeded' | 'custom';
  type?: EstablishmentType;
  province?: { id: number; code: number; name: string };
}

/** Payload accepted by POST /api/onboarding/establishments. */
export interface CreateEstablishmentDto {
  name: string;
  type: string;          // EstablishmentType.code
  wilaya_code: number;
  name_ar?: string;
  address?: string;
  phone?: string;
  email?: string;
}
