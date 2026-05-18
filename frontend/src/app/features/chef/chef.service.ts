import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface DashboardKpi {
  service_name: string;
  box_count: number;
  doctor_count: number;
  today_patient_count: number;
  active_consultation_count: number;
}

export interface Box {
  id: number;
  name?: string;
  label_ar: string;
  label_fr: string;
  type: 'consultation' | 'observation' | 'urgence';
  is_active: boolean;
  service_id: number;
  assigned_doctor?: { id: number; name: string } | null;
}

export interface DoctorShiftAssignment {
  id: number;
  user_id: number;
  service_id: number;
  borne_id: number;
  day_of_week: string[];
  start_time: string;
  end_time: string;
  assigned_by: number;
  is_active: boolean;
}

export interface ServiceDoctor {
  id: number;
  name: string;
  assigned_box: { id: number; name: string; label_ar: string; label_fr?: string } | null;
  schedule_summary: { day_of_week: string[]; start_time: string; end_time: string }[];
  is_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class ChefApiService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.baseUrl}/chef`;

  getDashboard(): Observable<DashboardKpi> {
    return this.http.get<DashboardKpi>(`${this.API}/dashboard`);
  }

  getBoxes(page = 1, perPage = 25): Observable<{ data: Box[]; total: number }> {
    return this.http.get<any>(`${this.API}/boxes`, { params: { page, per_page: perPage } });
  }

  getBox(id: number): Observable<Box> {
    return this.http.get<Box>(`${this.API}/boxes/${id}`);
  }

  createBox(data: Partial<Box>): Observable<Box> {
    return this.http.post<Box>(`${this.API}/boxes`, data);
  }

  updateBox(id: number, data: Partial<Box>): Observable<Box> {
    return this.http.put<Box>(`${this.API}/boxes/${id}`, data);
  }

  deleteBox(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/boxes/${id}`);
  }

  createAssignment(boxId: number, data: { user_id: number; day_of_week: string[]; start_time: string; end_time: string }): Observable<DoctorShiftAssignment> {
    return this.http.post<DoctorShiftAssignment>(`${this.API}/boxes/${boxId}/assignments`, data);
  }

  deleteAssignment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/assignments/${id}`);
  }

  getDoctors(): Observable<ServiceDoctor[]> {
    return this.http.get<ServiceDoctor[]>(`${this.API}/doctors`);
  }
}
