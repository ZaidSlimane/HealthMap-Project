# Implementation Plan: Radiology RDV Scheduling

## Overview

This plan implements the radiology appointment scheduling page with a drag-and-drop interface. The backend adds a `RadioScheduleController` and migration for `scheduled_at` on `radio_demande`. The frontend introduces a signal-based `RadiologyRdvFacade`, FullCalendar integration, and a component hierarchy (RdvPage, PendingRequestsPanel, RequestCard, CalendarPanel, DropZoneIndicator, RdvToast).

## Tasks

- [x] 1. Backend: Migration and Model Update
  - [x] 1.1 Create migration to add `scheduled_at` column to `radio_demande` table
    - Create migration file `add_scheduled_at_to_radio_demande.php`
    - Add nullable TIMESTAMP column `scheduled_at` after `status`
    - Add `scheduled_at` to the `$fillable` array and `$casts` in the `RadioDemande` model
    - _Requirements: 8.1, 8.2_

  - [x] 1.2 Create `RadioScheduleService` with scheduling business logic
    - Create `app/Modules/ClinicalCore/Services/RadioScheduleService.php`
    - Implement `schedule(int $demandeId, string $scheduledAt): RadioDemande` — validates status is "pending", checks time slot conflicts, sets status to "scheduled" and `scheduled_at`
    - Implement `unschedule(int $demandeId): RadioDemande` — validates status is "scheduled", resets to "pending" and clears `scheduled_at`
    - Implement `getAppointments(string $from, string $to, ?int $establishmentId): Collection` — returns scheduled demandes within date range
    - Implement `bypass(int $demandeId): RadioDemande` — validates status is "pending", sets status to "in_progress", leaves `scheduled_at` null
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 1.3 Create `RadioScheduleController` with REST endpoints
    - Create `app/Modules/ClinicalCore/Controllers/RadioScheduleController.php`
    - Implement `POST /radiology/schedule` — calls `RadioScheduleService::schedule`, returns `AppointmentDto` or 409/422
    - Implement `DELETE /radiology/schedule/{id}` — calls `RadioScheduleService::unschedule`, returns 200 or 404/409
    - Implement `GET /radiology/schedule/appointments` — accepts `from`, `to`, `establishment_id` query params, returns appointment list
    - Implement `PATCH /radiology/schedule/{id}/bypass` — calls `RadioScheduleService::bypass`, returns updated demande or 409
    - Create `ScheduleRequest` form request class for validation
    - Register routes in the appropriate routes file
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 1.4 Write property tests for `RadioScheduleService`
    - **Property 12: Backend schedule state transition and round-trip**
    - **Property 13: Backend rejects scheduling of non-pending requests**
    - **Property 14: Backend time slot conflict detection**
    - **Property 15: Backend date range query correctness**
    - **Property 16: Backend bypass transition**
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**

- [x] 2. Checkpoint - Backend verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Frontend: DTOs, API Service, and Facade
  - [x] 3.1 Create TypeScript interfaces and DTOs
    - Create `radio-demande.dto.ts` with `RadioDemandeDto` interface
    - Create `calendar-event.dto.ts` with `CalendarEventDto` interface
    - Create `schedule-payload.dto.ts` with `SchedulePayload` interface
    - Create `appointment-query-params.dto.ts` with `AppointmentQueryParams` interface
    - Create `schedule-drop-event.dto.ts` with `ScheduleDropEvent` interface
    - _Requirements: 6.1, 6.2_

  - [x] 3.2 Create `RadioScheduleApiService`
    - Create `radio-schedule-api.service.ts` in the radiology feature module
    - Implement `schedule(payload: SchedulePayload): Observable<AppointmentDto>`
    - Implement `unschedule(requestId: number): Observable<void>`
    - Implement `getAppointments(params: AppointmentQueryParams): Observable<AppointmentDto[]>`
    - Inject `HttpClient` and use `environment.baseUrl`
    - _Requirements: 6.5, 6.6, 8.1, 8.5, 8.6_

  - [x] 3.3 Create `RadiologyRdvFacade` service with signal-based state
    - Create `radiology-rdv.facade.ts`
    - Implement `pendingRequests` signal, `calendarEvents` signal, `loading` signal
    - Implement `urgentCount` and `normalCount` computed signals
    - Implement `loadPendingRequests(establishmentId: number)` — fetches pending demandes
    - Implement `loadCalendarEvents(dateRange: DateRange)` — fetches appointments for range
    - Implement `schedule(requestId, scheduledAt)` — optimistic update: move from pending to calendar, call API, rollback on error
    - Implement `unschedule(requestId)` — reverse: move from calendar to pending, call API, rollback on error
    - Implement `cancelRequest(requestId)` — remove from pending, call cancel API
    - Implement `bypassScheduling(requestId)` — remove from pending, call bypass API
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 3.4 Write property tests for facade state logic
    - **Property 1: Pending requests filter correctness**
    - **Validates: Requirements 2.1**

  - [ ]* 3.5 Write property tests for counter accuracy
    - **Property 2: Counter accuracy**
    - **Validates: Requirements 2.2, 2.3**

  - [ ]* 3.6 Write property test for schedule conservation invariant
    - **Property 6: Schedule conservation invariant**
    - **Validates: Requirements 4.6, 4.7, 6.3**

  - [ ]* 3.7 Write property test for schedule/unschedule round-trip
    - **Property 7: Schedule/unschedule round-trip (frontend)**
    - **Validates: Requirements 4.9, 6.4**

  - [ ]* 3.8 Write property test for error state preservation
    - **Property 8: Error state preservation**
    - **Validates: Requirements 4.10, 6.7**

- [x] 4. Checkpoint - Facade and API service verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Frontend: Pending Requests Panel Components
  - [x] 5.1 Create `RequestCardComponent` standalone component
    - Create `request-card.component.ts` with `request` input signal, `delete` and `bypass` output emitters
    - Render patient name (bold), service name (muted), exam type with icon
    - Conditionally display `Urgence_Badge` when urgency is "urgente"
    - Apply left border color: blue for "normale", orange for "semi-urgente", red for "urgente"
    - Add delete icon button (top-right) and "Passer sans RDV" ghost button (bottom)
    - Make card draggable using FullCalendar `Draggable` via `ElementRef` in `ngAfterViewInit`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 4.1, 9.3_

  - [x] 5.2 Create `PendingRequestsPanelComponent` standalone component
    - Create `pending-requests-panel.component.ts`
    - Inject `RadiologyRdvFacade`, read `pendingRequests()` signal
    - Implement `urgencyFilter` signal with toggle behavior (all ↔ urgente)
    - Implement `filteredRequests` computed signal with urgency filter and sort (urgente > semi-urgente > normale, then by `created_at` asc)
    - Render `Requests_Counter_Header` with urgent/normal counts, clickable to toggle filter
    - Render list of `RequestCardComponent` instances
    - Wire delete and bypass outputs to facade methods
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 9.2_

  - [ ]* 5.3 Write property tests for filter and sort logic
    - **Property 3: Urgency filter toggle round-trip**
    - **Property 4: Sort invariant — urgency then date**
    - **Validates: Requirements 2.4, 2.5, 2.7**

  - [ ]* 5.4 Write property test for urgency visual mapping
    - **Property 5: Urgency visual mapping**
    - **Validates: Requirements 3.4, 3.5, 3.7**

- [x] 6. Frontend: Calendar Panel Components
  - [x] 6.1 Create `DropZoneIndicatorComponent` standalone component
    - Create `drop-zone-indicator.component.ts` with `visible` input signal
    - Render "↓ Glissez une demande ici pour programmer un RDV" text when visible
    - Style as a teal strip at the top of the calendar area
    - _Requirements: 4.2, 4.3, 9.5_

  - [x] 6.2 Create `CalendarPanelComponent` standalone component
    - Create `calendar-panel.component.ts`
    - Install and configure `@fullcalendar/angular`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`
    - Accept `currentView`, `selectedDate`, `events` inputs
    - Configure FullCalendar: `timeGridDay` (06:00–20:00), `timeGridWeek`, `dayGridMonth`
    - Enable `droppable: true` for timeGridDay and timeGridWeek, disable for dayGridMonth
    - Handle `eventReceive` (external drop) — emit `eventDrop` output with request ID and datetime
    - Highlight hovered time slot with teal background during drag
    - Render `Calendar_Event_Block` with patient name and exam type
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 9.4_

  - [ ]* 6.3 Write property test for drag-drop disabled in month view
    - **Property 9: Drag-drop disabled in month view**
    - **Validates: Requirements 5.4**

  - [ ]* 6.4 Write property test for calendar event content completeness
    - **Property 10: Calendar event content completeness**
    - **Validates: Requirements 5.6**

- [x] 7. Frontend: Toast and Page Shell
  - [x] 7.1 Create `RdvToastComponent` standalone component
    - Create `rdv-toast.component.ts`
    - Use PrimeNG Toast or custom implementation
    - Display patient name and scheduled time in confirmation message
    - Display "Annuler" undo action button
    - Auto-dismiss after 5 seconds
    - Emit undo action to facade on "Annuler" click
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 9.6_

  - [ ]* 7.2 Write property test for toast message content
    - **Property 11: Toast message content**
    - **Validates: Requirements 7.2**

  - [x] 7.3 Create `RdvPageComponent` shell standalone component
    - Create `rdv-page.component.ts`
    - Inject `RadiologyRdvFacade`
    - Implement `selectedDate` signal (default: today) and `currentView` signal (default: 'timeGridDay')
    - Render `hm-page-header` with title "Gestion des RDV Radiologie"
    - Add date navigation controls (previous, today, next) that update `selectedDate`
    - Add `View_Toggle` segmented control (Jour, Semaine, Mois) that updates `currentView`
    - Display current date in human-readable format
    - Compose `PendingRequestsPanelComponent` (left, 300px fixed) and `CalendarPanelComponent` (right, fluid)
    - Compose `DropZoneIndicatorComponent` and `RdvToastComponent`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 9.1_

- [x] 8. Frontend: Wiring and Integration
  - [x] 8.1 Wire drag-and-drop flow end-to-end
    - Connect `CalendarPanelComponent.eventDrop` output to `RadiologyRdvFacade.schedule()`
    - Connect `RdvToastComponent` undo action to `RadiologyRdvFacade.unschedule()`
    - Manage `DropZoneIndicatorComponent` visibility via drag start/end events from FullCalendar
    - Trigger `loadPendingRequests` and `loadCalendarEvents` on page init and date change
    - Handle error responses: show error toast, preserve state
    - _Requirements: 4.2, 4.3, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 6.3, 6.4, 6.7_

  - [x] 8.2 Register route and integrate with existing navigation
    - Add route entry for the RDV scheduling page in the radiology routing module
    - Ensure lazy loading of the RdvPageComponent
    - Verify navigation from existing radiology menu links to the new page
    - _Requirements: 1.1, 9.1_

  - [ ]* 8.3 Write integration tests for full scheduling flow
    - Test drag card → drop on calendar → API call → state update → toast display
    - Test undo flow: toast undo click → API call → state rollback
    - Test error handling: API error → state preserved → error toast
    - _Requirements: 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 6.3, 6.4, 6.7_

- [x] 9. Final Checkpoint - Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (Properties 1–16)
- Unit tests validate specific examples and edge cases
- The optimistic UI pattern (update → API call → rollback on error) is implemented in the facade (task 3.3)
- FullCalendar external drag is configured via the `@fullcalendar/interaction` plugin's `Draggable` class

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "3.2"] },
    { "id": 2, "tasks": ["1.3", "1.4", "3.3"] },
    { "id": 3, "tasks": ["3.4", "3.5", "3.6", "3.7", "3.8"] },
    { "id": 4, "tasks": ["5.1", "6.1"] },
    { "id": 5, "tasks": ["5.2", "6.2", "5.3", "5.4"] },
    { "id": 6, "tasks": ["6.3", "6.4", "7.1"] },
    { "id": 7, "tasks": ["7.2", "7.3"] },
    { "id": 8, "tasks": ["8.1", "8.2"] },
    { "id": 9, "tasks": ["8.3"] }
  ]
}
```
