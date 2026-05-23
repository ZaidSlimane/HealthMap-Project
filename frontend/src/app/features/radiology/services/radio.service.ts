import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RadioService {
  private readonly http = inject(HttpClient);
  private readonly API = environment.baseUrl;

  getExamTypes(search?: string): Observable<any[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<any[]>(`${this.API}/radiology/exam-types`, { params });
  }

  createRequest(payload: {
    consultation_id: number;
    radiology_exam_type_ids: number[];
    urgency?: string;
    notes?: string;
  }): Observable<any[]> {
    return this.http.post<any[]>(`${this.API}/radiology/requests`, payload);
  }

  getRequestsForConsultation(consultationId: number): Observable<any[]> {
    const params = new HttpParams().set('consultation_id', consultationId);
    return this.http.get<any[]>(`${this.API}/radiology/requests`, { params });
  }

  getWorklist(params?: any): Observable<any> {
    return this.http.get<any>(`${this.API}/radiology/worklist`, { params });
  }

  getRequestDetail(id: number): Observable<any> {
    return this.http.get<any>(`${this.API}/radiology/requests/${id}`);
  }

  uploadResult(demandeId: number, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.API}/radiology/requests/${demandeId}/result`, formData);
  }

  downloadResult(resultId: number): Observable<Blob> {
    return this.http.get(`${this.API}/radiology/results/${resultId}/download`, {
      responseType: 'blob',
    });
  }

  cancelRequest(id: number): Observable<any> {
    return this.http.patch<any>(`${this.API}/radiology/requests/${id}/cancel`, {});
  }
}
