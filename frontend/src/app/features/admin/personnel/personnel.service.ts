import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CredentialsInput,
  Paginated,
  PersonnelInput,
  PersonnelRow,
  PosteRef,
  RoleRef,
  ServiceRef,
  UserRow,
} from './personnel.models';

@Injectable({ providedIn: 'root' })
export class PersonnelService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/admin`;

  // Tab 0 — Personnel
  listPersonnel(q = '', page = 1, perPage = 25): Observable<Paginated<PersonnelRow>> {
    let params = new HttpParams().set('page', page).set('per_page', perPage);
    if (q) params = params.set('q', q);
    return this.http.get<Paginated<PersonnelRow>>(`${this.base}/personnel`, { params });
  }
  createPersonnel(input: PersonnelInput): Observable<PersonnelRow> {
    return this.http.post<PersonnelRow>(`${this.base}/personnel`, input);
  }
  updatePersonnel(id: number, input: PersonnelInput): Observable<PersonnelRow> {
    return this.http.patch<PersonnelRow>(`${this.base}/personnel/${id}`, input);
  }
  deletePersonnel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/personnel/${id}`);
  }

  // Tab 1 — Utilisateurs
  listUsers(q = '', page = 1, perPage = 25): Observable<Paginated<UserRow>> {
    let params = new HttpParams().set('page', page).set('per_page', perPage);
    if (q) params = params.set('q', q);
    return this.http.get<Paginated<UserRow>>(`${this.base}/users`, { params });
  }
  setCredentials(id: number, input: CredentialsInput): Observable<UserRow> {
    return this.http.post<UserRow>(`${this.base}/users/${id}/credentials`, input);
  }
  revokeCredentials(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${id}/credentials`);
  }
  setActive(id: number, isActive: boolean): Observable<UserRow> {
    return this.http.post<UserRow>(`${this.base}/users/${id}/active`, { is_active: isActive });
  }

  // Tab 2 — Postes
  listPostes(perPage = 100): Observable<Paginated<PosteRef>> {
    return this.http.get<Paginated<PosteRef>>(`${this.base}/postes`, {
      params: new HttpParams().set('per_page', perPage),
    });
  }
  createPoste(label: string, label_ar?: string): Observable<PosteRef> {
    return this.http.post<PosteRef>(`${this.base}/postes`, { label, label_ar });
  }
  updatePoste(id: number, label: string, label_ar?: string): Observable<PosteRef> {
    return this.http.patch<PosteRef>(`${this.base}/postes/${id}`, { label, label_ar });
  }
  deletePoste(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/postes/${id}`);
  }

  // Reference lists for dropdowns
  listRoles(): Observable<RoleRef[]> {
    return this.http.get<RoleRef[]>(`${this.base}/roles`);
  }
  listServices(): Observable<ServiceRef[]> {
    return this.http.get<ServiceRef[]>(`${this.base}/services`);
  }
}
