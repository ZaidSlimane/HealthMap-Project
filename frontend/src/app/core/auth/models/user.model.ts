/**
 * Canonical role strings as stored in the database `roles.role` column.
 * All comparisons must use these exact strings or a case-insensitive lookup.
 */
export type UserRole = 'Admin' | 'Doctor' | 'BDE' | 'Pharmacy' | 'Reception' | 'ChefService' | 'RadioTech' | 'LabTech' | string;

export interface UserRoleDetail {
  id: number;
  role: UserRole;
}

export interface User {
  id: number;
  name: string | null;
  first_name?: string | null;
  username?: string | null;
  email: string;
  roles: UserRoleDetail[];
  role_names?: string[];
  must_change_password?: boolean;
  onboarding_completed?: boolean;
  onboarding_completed_at?: string | null;
  service?: { id: number; name: string; code?: string } | null;
  services?: { id: number; name: string; code?: string }[];
  establishment?: {
    id: number;
    slug: string;
    name: string;
    type?: { code: string; label: string };
    province?: { code: number; name: string };
  } | null;
}

/**
 * Default landing route per role. Keyed by LOWERCASE canonical form.
 * getUserRole() normalizes to lowercase before lookup.
 */
export const ROLE_DEFAULT_ROUTES: Record<string, string> = {
  admin: '/admin/dashboard',
  doctor: '/profil',
  chefservice: '/chef/dashboard',
  bde: '/bde/dashboard',
  radiotech: '/radiology',
  labtech: '/laboratory/dashboard',
  pharmacien: '/pharmacie/dashboard',
  pharmacy: '/pharmacie/dashboard',
  reception: '/admin/dashboard',
};
