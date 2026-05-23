import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LaboService {
  private readonly http = inject(HttpClient);
  private readonly API = environment.baseUrl;

  getCatalog(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/laboratory/catalog`);
  }

  createRequest(payload: {
    consultation_id: number;
    items: { item_type: string; item_id: number }[];
    urgency?: string;
    notes?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.API}/laboratory/requests`, payload);
  }

  getRequestsForConsultation(consultationId: number): Observable<any[]> {
    const params = new HttpParams().set('consultation_id', consultationId);
    return this.http.get<any[]>(`${this.API}/laboratory/requests`, { params });
  }

  getWorklist(params?: any): Observable<any> {
    return this.http.get<any>(`${this.API}/laboratory/worklist`, { params });
  }

  getRequestDetail(id: number): Observable<any> {
    return this.http.get<any>(`${this.API}/laboratory/requests/${id}`);
  }

  enterResults(demandeId: number, results: any[]): Observable<any> {
    return this.http.post<any>(`${this.API}/laboratory/requests/${demandeId}/results`, { results });
  }

  cancelRequest(id: number): Observable<any> {
    return this.http.patch<any>(`${this.API}/laboratory/requests/${id}/cancel`, {});
  }
}
