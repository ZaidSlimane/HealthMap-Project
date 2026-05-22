import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, EMPTY } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { RadioScheduleApiService } from './radio-schedule-api.service';
import { RadioDemandeDto, CalendarEventDto, DateRange, SchedulePayload } from '../models';

const URGENCY_COLORS: Record<string, string> = {
  normale: '#2563eb',
  'semi-urgente': '#ea580c',
  urgente: '#dc2626',
};

@Injectable({ providedIn: 'root' })
export class RadiologyRdvFacade {
  private readonly http = inject(HttpClient);
  private readonly api = inject(RadioScheduleApiService);

  // State signals
  readonly pendingRequests = signal<RadioDemandeDto[]>([]);
  readonly calendarEvents = signal<CalendarEventDto[]>([]);
  readonly loading = signal<boolean>(false);

  // Computed signals
  readonly urgentCount = computed(() =>
    this.pendingRequests().filter(r => r.urgency === 'urgente').length
  );
  readonly normalCount = computed(() =>
    this.pendingRequests().filter(r => r.urgency === 'normale').length
  );

  /**
   * Loads pending radiology requests for the given establishment.
   */
  loadPendingRequests(establishmentId: number): void {
    this.loading.set(true);
    this.http
      .get<RadioDemandeDto[]>(`${environment.baseUrl}/radiology/requests`, {
        params: { status: 'pending', establishment_id: establishmentId.toString() },
      })
      .subscribe({
        next: (requests) => {
          this.pendingRequests.set(requests);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  /**
   * Loads calendar events (scheduled appointments) for the given date range.
   */
  loadCalendarEvents(dateRange: DateRange): void {
    this.loading.set(true);
    this.api
      .getAppointments({ from: dateRange.from, to: dateRange.to })
      .subscribe({
        next: (appointments) => {
          const events = appointments.map(a => this.mapDemandeToEvent(a));
          this.calendarEvents.set(events);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  /**
   * Schedules a pending request at the given time.
   * Uses optimistic update: moves item from pending to calendar immediately,
   * then calls API. Rolls back on error.
   */
  schedule(requestId: number, scheduledAt: string): Observable<RadioDemandeDto> {
    const currentPending = this.pendingRequests();
    const currentEvents = this.calendarEvents();

    const request = currentPending.find(r => r.id === requestId);
    if (!request) {
      return EMPTY;
    }

    // Optimistic update
    const updatedRequest: RadioDemandeDto = {
      ...request,
      status: 'scheduled',
      scheduled_at: scheduledAt,
    };
    this.pendingRequests.set(currentPending.filter(r => r.id !== requestId));
    this.calendarEvents.set([...currentEvents, this.mapDemandeToEvent(updatedRequest)]);

    const payload: SchedulePayload = {
      radio_demande_id: requestId,
      scheduled_at: scheduledAt,
    };

    return this.api.schedule(payload).pipe(
      tap((response) => {
        // Update with server response to ensure consistency
        const events = this.calendarEvents().map(e =>
          e.extendedProps.requestId === requestId
            ? this.mapDemandeToEvent(response)
            : e
        );
        this.calendarEvents.set(events);
      }),
      catchError((error) => {
        // Rollback on error
        this.pendingRequests.set(currentPending);
        this.calendarEvents.set(currentEvents);
        throw error;
      })
    );
  }

  /**
   * Unschedules a request: moves from calendar back to pending.
   * Uses optimistic update with rollback on error.
   */
  unschedule(requestId: number): Observable<void> {
    const currentPending = this.pendingRequests();
    const currentEvents = this.calendarEvents();

    const event = currentEvents.find(e => e.extendedProps.requestId === requestId);
    if (!event) {
      return EMPTY;
    }

    // Optimistic update: move from calendar to pending
    const restoredRequest: RadioDemandeDto = {
      id: event.extendedProps.requestId,
      patient_name: event.extendedProps.patientName,
      exam_type: event.extendedProps.examType,
      urgency: event.extendedProps.urgency as RadioDemandeDto['urgency'],
      status: 'pending',
      scheduled_at: null,
      service_name: '',
      exam_type_icon: '',
      created_at: '',
    };

    this.calendarEvents.set(currentEvents.filter(e => e.extendedProps.requestId !== requestId));
    this.pendingRequests.set([...currentPending, restoredRequest]);

    return this.api.unschedule(requestId).pipe(
      catchError((error) => {
        // Rollback on error
        this.pendingRequests.set(currentPending);
        this.calendarEvents.set(currentEvents);
        throw error;
      })
    );
  }

  /**
   * Cancels a pending request: removes from pending list and calls cancel API.
   */
  cancelRequest(requestId: number): Observable<void> {
    const currentPending = this.pendingRequests();

    // Optimistic update: remove from pending
    this.pendingRequests.set(currentPending.filter(r => r.id !== requestId));

    return this.http
      .delete<void>(`${environment.baseUrl}/radiology/requests/${requestId}`)
      .pipe(
        catchError(() => {
          // Rollback on error
          this.pendingRequests.set(currentPending);
          return EMPTY;
        })
      );
  }

  /**
   * Bypasses scheduling: removes from pending and marks as in_progress via API.
   */
  bypassScheduling(requestId: number): Observable<void> {
    const currentPending = this.pendingRequests();

    // Optimistic update: remove from pending
    this.pendingRequests.set(currentPending.filter(r => r.id !== requestId));

    return this.http
      .patch<void>(`${environment.baseUrl}/radiology/schedule/${requestId}/bypass`, {})
      .pipe(
        catchError(() => {
          // Rollback on error
          this.pendingRequests.set(currentPending);
          return EMPTY;
        })
      );
  }

  /**
   * Maps a RadioDemandeDto to a CalendarEventDto with urgency-based colors.
   */
  private mapDemandeToEvent(demande: RadioDemandeDto): CalendarEventDto {
    const color = URGENCY_COLORS[demande.urgency] ?? URGENCY_COLORS['normale'];
    const start = demande.scheduled_at ?? new Date().toISOString();
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // +30 minutes

    return {
      id: `event-${demande.id}`,
      title: `${demande.patient_name} - ${demande.exam_type}`,
      start,
      end: endDate.toISOString(),
      extendedProps: {
        requestId: demande.id,
        patientName: demande.patient_name,
        examType: demande.exam_type,
        urgency: demande.urgency,
      },
      backgroundColor: color,
      borderColor: color,
    };
  }
}
