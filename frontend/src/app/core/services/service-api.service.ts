import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ServiceConfig } from '../../features/services-config/models/service-config.model';

@Injectable({ providedIn: 'root' })
export class ServiceApiService {
  private readonly apiUrl = `${environment.baseUrl}/clinical-core/services`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ data: ServiceConfig[], current_page: number, last_page: number }> {
    return this.http.get<{ data: ServiceConfig[], current_page: number, last_page: number }>(this.apiUrl);
  }

  getServiceTypes(): Observable<{ data: any[], current_page: number, last_page: number }> {
    return this.http.get<{ data: any[], current_page: number, last_page: number }>(`${environment.baseUrl}/clinical-core/service-types`);
  }

  getById(id: string): Observable<ServiceConfig> {
    return this.http.get<ServiceConfig>(`${this.apiUrl}/${id}`);
  }

  create(service: Partial<ServiceConfig>): Observable<ServiceConfig> {
    return this.http.post<ServiceConfig>(this.apiUrl, service);
  }

  update(id: string, service: Partial<ServiceConfig>): Observable<ServiceConfig> {
    return this.http.put<ServiceConfig>(`${this.apiUrl}/${id}`, service);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ── Service Types CRUD ──

  createServiceType(data: { label: string }): Observable<any> {
    return this.http.post(`${environment.baseUrl}/clinical-core/service-types`, data);
  }

  deleteServiceType(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.baseUrl}/clinical-core/service-types/${id}`);
  }
}
