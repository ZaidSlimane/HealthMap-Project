export type UserRole = 'Admin' | 'superadmin' | 'Doctor' | 'ChefService' | 'bde' | 'radio' | 'labo' | 'consultation' | 'pharmacie' | 'service';

export interface UserRoleDetail {
  id: number;
  role: UserRole;
}

export interface User {
  id: number;
  name: string;
  email: string;
  roles: UserRoleDetail[];
  role_names?: string[];
  /** Returned by the API; true on first login until the wizard completes. */
  must_change_password?: boolean;
  /** True once POST /onboarding/complete has succeeded for this user. */
  onboarding_completed?: boolean;
  onboarding_completed_at?: string | null;
  /** Single service (legacy BelongsTo) */
  service?: { id: number; name: string; code?: string } | null;
  /** Multiple services (BelongsToMany — for doctors) */
  services?: { id: number; name: string; code?: string }[];
  /** The establishment this user is linked to (set by onboarding). */
  establishment?: {
    id: number;
    slug: string;
    name: string;
    type?: { code: string; label: string };
    province?: { code: number; name: string };
  } | null;
}

export const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
  Admin: '/admin/dashboard',
  superadmin: '/admin/dashboard',
  Doctor: '/profil',
  ChefService: '/chef/dashboard',
  bde: '/bde/patients',
  radio: '/radiology/requests',
  labo: '/labo/results',
  consultation: '/consultation',
  pharmacie: '/admin/dashboard',
  service: '/admin/dashboard',
};
