import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SchedulePayload, AppointmentQueryParams, RadioDemandeDto } from '../models';

@Injectable({ providedIn: 'root' })
export class RadioScheduleApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.baseUrl}/radiology/schedule`;

  schedule(payload: SchedulePayload): Observable<RadioDemandeDto> {
    return this.http.post<RadioDemandeDto>(this.baseUrl, payload);
  }

  unschedule(requestId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${requestId}`);
  }

  getAppointments(params: AppointmentQueryParams): Observable<RadioDemandeDto[]> {
    let httpParams = new HttpParams()
      .set('from', params.from)
      .set('to', params.to);

    if (params.establishment_id != null) {
      httpParams = httpParams.set('establishment_id', params.establishment_id);
    }

    return this.http.get<RadioDemandeDto[]>(`${this.baseUrl}/appointments`, { params: httpParams });
  }
}
