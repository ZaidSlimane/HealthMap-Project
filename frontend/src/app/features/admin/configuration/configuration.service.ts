import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Bed,
  BedInput,
  ClinicalService,
  ClinicalServiceInput,
  EstablishmentUnit,
  EstablishmentUnitInput,
  Paginated,
  Room,
  RoomInput,
  ServiceType,
} from './configuration.models';

/**
 * Thin wrapper around the backend's tenant-scoped ClinicalCore endpoints
 * for the Configuration admin page.
 *
 * Hierarchy:  Service → EstablishmentUnit → Room → Bed
 *
 * The backend's `BelongsToEstablishment` trait auto-filters reads and
 * auto-fills `establishment_id` on writes, so this service never has to
 * pass it explicitly.
 */
@Injectable({ providedIn: 'root' })
export class ConfigurationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/clinical-core`;

  // ── Service Types (global reference) ───────────────────────────────
  listServiceTypes(perPage = 100): Observable<Paginated<ServiceType>> {
    const params = new HttpParams().set('per_page', perPage);
    return this.http.get<Paginated<ServiceType>>(`${this.base}/service-types`, { params });
  }

  // ── Services (top of clinical tree) ────────────────────────────────
  listServices(perPage = 200): Observable<Paginated<ClinicalService>> {
    const params = new HttpParams().set('per_page', perPage);
    return this.http.get<Paginated<ClinicalService>>(`${this.base}/services`, { params });
  }
  createService(input: ClinicalServiceInput): Observable<ClinicalService> {
    return this.http.post<ClinicalService>(`${this.base}/services`, input);
  }
  updateService(id: number, input: Partial<ClinicalServiceInput>): Observable<ClinicalService> {
    return this.http.put<ClinicalService>(`${this.base}/services/${id}`, input);
  }
  deleteService(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/services/${id}`);
  }

  // ── Establishment Units (child of Service) ─────────────────────────
  listUnits(perPage = 200): Observable<Paginated<EstablishmentUnit>> {
    const params = new HttpParams().set('per_page', perPage);
    return this.http.get<Paginated<EstablishmentUnit>>(`${this.base}/establishment-units`, { params });
  }
  createUnit(input: EstablishmentUnitInput): Observable<EstablishmentUnit> {
    return this.http.post<EstablishmentUnit>(`${this.base}/establishment-units`, input);
  }
  updateUnit(id: number, input: Partial<EstablishmentUnitInput>): Observable<EstablishmentUnit> {
    return this.http.put<EstablishmentUnit>(`${this.base}/establishment-units/${id}`, input);
  }
  deleteUnit(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/establishment-units/${id}`);
  }

  // ── Rooms (child of Unit) ──────────────────────────────────────────
  listRooms(perPage = 500): Observable<Paginated<Room>> {
    const params = new HttpParams().set('per_page', perPage);
    return this.http.get<Paginated<Room>>(`${this.base}/rooms`, { params });
  }
  createRoom(input: RoomInput): Observable<Room> {
    return this.http.post<Room>(`${this.base}/rooms`, input);
  }
  updateRoom(id: number, input: Partial<RoomInput>): Observable<Room> {
    return this.http.put<Room>(`${this.base}/rooms/${id}`, input);
  }
  deleteRoom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/rooms/${id}`);
  }

  // ── Beds (child of Room) ───────────────────────────────────────────
  listBeds(perPage = 1000): Observable<Paginated<Bed>> {
    const params = new HttpParams().set('per_page', perPage);
    return this.http.get<Paginated<Bed>>(`${this.base}/beds`, { params });
  }
  createBed(input: BedInput): Observable<Bed> {
    return this.http.post<Bed>(`${this.base}/beds`, input);
  }
  updateBed(id: number, input: Partial<BedInput>): Observable<Bed> {
    return this.http.put<Bed>(`${this.base}/beds/${id}`, input);
  }
  deleteBed(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/beds/${id}`);
  }
}
