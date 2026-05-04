/**
 * DTOs returned by the /api/admin/* endpoints powering the
 * "Personnel & Utilisateurs" page (3 tabs).
 */

export interface PosteRef { id: number; label: string; label_ar?: string | null; }
export interface ServiceRef { id: number; name: string | null; }
export interface RoleRef { id: number; role: string; }

export interface PersonnelRow {
  id: number;
  matricule: string | null;
  name: string | null;          // nom (laqab fr)
  first_name: string | null;    // prenom (ism fr)
  name_ar: string | null;       // laqab (ar)
  first_name_ar: string | null; // ism (ar)
  poste_id: number | null;
  service_id: number | null;
  is_consultant: boolean;
  email?: string | null;
  username?: string | null;
  is_active?: boolean;
  poste?: PosteRef | null;
  service?: ServiceRef | null;
  roles?: RoleRef[];
}

export interface UserRow extends PersonnelRow {
  username: string;            // never null in the Utilisateurs view
  online: 0 | 1 | boolean;     // boolean from the joined sessions table
  last_activity: number | null;
}

export interface Paginated<T> {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
}

/** Tab 0 → POST/PATCH payload. */
export type PersonnelInput = Partial<Pick<
  PersonnelRow,
  'matricule' | 'name' | 'first_name' | 'name_ar' | 'first_name_ar'
  | 'poste_id' | 'service_id' | 'is_consultant' | 'email'
>>;

/** Tab 1 → POST /users/{id}/credentials. */
export interface CredentialsInput {
  username: string;
  password: string;
  role_ids?: number[];
  must_change_password?: boolean;
}
