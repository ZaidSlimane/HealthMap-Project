import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface EstablishmentDto {
  id: number;
  slug: string;
  name: string;
  name_ar: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  fax?: string | null;
  directeur?: string | null;
  establishment_type_id: number;
  province_id: number;
  type?: { id: number; code: string; label: string };
  province?: { id: number; code: number; name: string };
}

export interface EstablishmentUpdateDto {
  name?: string;
  name_ar?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  fax?: string | null;
  directeur?: string | null;
}

@Injectable({ providedIn: 'root' })
export class EstablishmentApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/clinical-core/establishments`;

  getById(id: number): Observable<EstablishmentDto> {
    return this.http.get<EstablishmentDto>(`${this.base}/${id}`);
  }

  update(id: number, data: EstablishmentUpdateDto): Observable<EstablishmentDto> {
    return this.http.patch<EstablishmentDto>(`${this.base}/${id}`, data);
  }
}
