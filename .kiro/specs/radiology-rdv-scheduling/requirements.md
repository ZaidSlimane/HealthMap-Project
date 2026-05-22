# Requirements Document

## Introduction

Redesign of the legacy radiology appointment scheduling page ("Gestion des RDV Radiologie") in the HealthMap hospital management application. The redesigned page replaces the existing worklist with a drag-and-drop scheduling interface featuring a left panel of pending requests and a FullCalendar-based time grid. The redesign addresses three core UX problems: ambiguous drag targets, information overload in request cards, and lack of workflow state feedback.

## Glossary

- **RDV_Page**: The top-level page shell component that provides the layout, page header, date navigation, and view toggle for the radiology appointment scheduling interface.
- **Pending_Requests_Panel**: The fixed-width left panel (300px) that displays the list of pending radiology requests as draggable cards with live counters and filtering.
- **Request_Card**: A compact, draggable card atom representing a single pending radiology request, displaying patient name, service, exam type, urgency indicator, and action buttons.
- **Urgence_Badge**: A red pill-shaped badge displayed conditionally on request cards when the request urgency is "urgente".
- **Requests_Counter_Header**: The header section of the pending requests panel showing live counts of urgent and normal requests, with filter-on-click behavior.
- **Calendar_Panel**: The fluid-width panel wrapping FullCalendar that displays scheduled appointments in a time grid and accepts dropped request cards.
- **Drop_Zone_Indicator**: A visual strip that appears at the top of the calendar panel only during an active drag operation, instructing the user to drop a request to schedule an appointment.
- **Calendar_Event_Block**: A colored block rendered on the calendar time grid representing a scheduled radiology appointment.
- **RDV_Toast**: A transient confirmation notification displayed after a successful drop operation, with an undo action.
- **RadiologyRdvFacade**: The shared Angular service (facade) that manages state between the Pending_Requests_Panel and Calendar_Panel, orchestrates API calls for scheduling, and synchronizes the pending list and calendar events.
- **View_Toggle**: A segmented control in the page header allowing the user to switch between Jour (day), Semaine (week), and Mois (month) calendar views.
- **RadioDemande**: The existing backend model representing a radiology exam request with urgency, status, patient, and exam type information.
- **Time_Slot**: A discrete time interval on the calendar grid (e.g., 30-minute block) that can receive a dropped request card.

## Requirements

### Requirement 1: Page Layout and Header

**User Story:** As a radiology technician, I want a clear page layout with date navigation and view controls, so that I can efficiently manage daily appointment scheduling.

#### Acceptance Criteria

1. THE RDV_Page SHALL display the title "Gestion des RDV Radiologie" in the page header.
2. THE RDV_Page SHALL provide date navigation controls (previous, today, next) in the page header.
3. THE RDV_Page SHALL display the currently selected date in a human-readable format in the page header.
4. THE View_Toggle SHALL provide three options: "Jour", "Semaine", and "Mois".
5. WHEN the page loads, THE View_Toggle SHALL default to the "Jour" view.
6. THE RDV_Page SHALL render the Pending_Requests_Panel at a fixed width of 300px on the left side.
7. THE RDV_Page SHALL render the Calendar_Panel in the remaining fluid width to the right of the Pending_Requests_Panel.

### Requirement 2: Pending Requests Panel

**User Story:** As a radiology technician, I want to see all pending requests in a scannable list with live counters, so that I can quickly assess workload and prioritize urgent cases.

#### Acceptance Criteria

1. THE Pending_Requests_Panel SHALL display all RadioDemande items with status "pending" for the current establishment.
2. THE Requests_Counter_Header SHALL display a live count of requests with urgency "urgente" labeled "urgentes".
3. THE Requests_Counter_Header SHALL display a live count of requests with urgency "normale" labeled "normales".
4. WHEN the urgentes counter is clicked, THE Pending_Requests_Panel SHALL filter the list to show only requests with urgency "urgente".
5. WHEN the urgentes counter is clicked a second time, THE Pending_Requests_Panel SHALL remove the urgency filter and show all pending requests.
6. THE Pending_Requests_Panel SHALL update the counters and list in real-time when a request is scheduled, cancelled, or newly created.
7. THE Pending_Requests_Panel SHALL sort requests by urgency (urgente first) then by creation date ascending.

### Requirement 3: Request Card Design

**User Story:** As a radiology technician, I want compact and scannable request cards with clear urgency indicators, so that I can quickly identify patient information and priority without visual overload.

#### Acceptance Criteria

1. THE Request_Card SHALL display the patient name in bold as the primary text element.
2. THE Request_Card SHALL display the requesting service name in small muted text below the patient name.
3. THE Request_Card SHALL display the exam type with an icon and label.
4. WHEN the request urgency is "urgente", THE Request_Card SHALL display the Urgence_Badge.
5. WHEN the request urgency is "normale", THE Request_Card SHALL hide the Urgence_Badge.
6. THE Urgence_Badge SHALL render as a red pill-shaped label with the text "Urgent".
7. THE Request_Card SHALL display a left border colored blue for "normale" urgency, orange for "semi-urgente" urgency, and red for "urgente" urgency.
8. THE Request_Card SHALL display a delete icon button positioned at the top-right corner.
9. THE Request_Card SHALL display a "Passer sans RDV" ghost button at the bottom of the card.
10. WHEN the delete icon is clicked, THE RadiologyRdvFacade SHALL cancel the corresponding RadioDemande.
11. WHEN "Passer sans RDV" is clicked, THE RadiologyRdvFacade SHALL mark the request as processed without scheduling a calendar appointment.

### Requirement 4: Drag and Drop Scheduling

**User Story:** As a radiology technician, I want to drag request cards onto the calendar to schedule appointments, so that I can intuitively assign time slots without filling out forms.

#### Acceptance Criteria

1. THE Request_Card SHALL be draggable using HTML5 drag-and-drop or CDK drag-and-drop.
2. WHEN a drag operation starts, THE Drop_Zone_Indicator SHALL become visible at the top of the Calendar_Panel displaying "↓ Glissez une demande ici pour programmer un RDV".
3. WHEN a drag operation ends without a drop, THE Drop_Zone_Indicator SHALL hide.
4. WHILE a Request_Card is being dragged over a Time_Slot, THE Calendar_Panel SHALL highlight the hovered Time_Slot with a teal background color.
5. WHEN a Request_Card is dropped on a valid Time_Slot, THE RadiologyRdvFacade SHALL call the schedule endpoint with the request ID and the selected time slot.
6. WHEN the schedule endpoint responds successfully, THE RadiologyRdvFacade SHALL remove the request from the Pending_Requests_Panel list.
7. WHEN the schedule endpoint responds successfully, THE RadiologyRdvFacade SHALL add a new Calendar_Event_Block at the dropped time slot.
8. WHEN a Request_Card is dropped on a valid Time_Slot, THE RDV_Toast SHALL display a confirmation message with an undo action.
9. WHEN the undo action on the RDV_Toast is clicked within the toast duration, THE RadiologyRdvFacade SHALL reverse the scheduling operation, removing the event from the calendar and restoring the request to the pending list.
10. IF the schedule endpoint returns an error, THEN THE RDV_Toast SHALL display an error message and the request SHALL remain in the Pending_Requests_Panel.

### Requirement 5: Calendar Views

**User Story:** As a radiology technician, I want to switch between day, week, and month views, so that I can plan appointments at different time horizons.

#### Acceptance Criteria

1. WHEN the "Jour" view is selected, THE Calendar_Panel SHALL display a time grid from 06:00 to 20:00 with colored Calendar_Event_Blocks for scheduled appointments.
2. WHEN the "Semaine" view is selected, THE Calendar_Panel SHALL display compressed day columns with time grids, and drag-and-drop scheduling SHALL remain functional.
3. WHEN the "Mois" view is selected, THE Calendar_Panel SHALL display compact dot indicators or count badges for days with scheduled appointments.
4. WHILE the "Mois" view is active, THE Calendar_Panel SHALL disable drag-and-drop scheduling.
5. WHILE the "Mois" view is active and a drag operation is attempted, THE Calendar_Panel SHALL display a tooltip indicating that scheduling is only available in Jour or Semaine views.
6. THE Calendar_Event_Block SHALL display the patient name and exam type within the event block.
7. THE Calendar_Event_Block SHALL use a color that distinguishes it from available time slots.

### Requirement 6: Facade Service and Data Flow

**User Story:** As a developer, I want a single facade service managing state between the pending panel and calendar, so that data remains consistent and operations are centralized.

#### Acceptance Criteria

1. THE RadiologyRdvFacade SHALL expose an observable stream of pending requests for the Pending_Requests_Panel to subscribe to.
2. THE RadiologyRdvFacade SHALL expose an observable stream of calendar events for the Calendar_Panel to subscribe to.
3. WHEN a scheduling operation succeeds, THE RadiologyRdvFacade SHALL atomically remove the item from the pending stream and add the event to the calendar stream.
4. WHEN an undo operation is triggered, THE RadiologyRdvFacade SHALL atomically restore the item to the pending stream and remove the event from the calendar stream.
5. THE RadiologyRdvFacade SHALL load pending requests from the existing RadioDemande API endpoint filtered by status "pending".
6. THE RadiologyRdvFacade SHALL load calendar events from a scheduling endpoint filtered by the currently selected date range.
7. IF a network error occurs during a scheduling operation, THEN THE RadiologyRdvFacade SHALL preserve the current state without modifying either stream.

### Requirement 7: Toast Confirmation

**User Story:** As a radiology technician, I want immediate visual feedback after scheduling an appointment, so that I have confidence the action was recorded and can undo mistakes.

#### Acceptance Criteria

1. WHEN a scheduling operation completes successfully, THE RDV_Toast SHALL appear within 300ms of the drop event.
2. THE RDV_Toast SHALL display the patient name and the scheduled time in the confirmation message.
3. THE RDV_Toast SHALL display an "Annuler" (undo) action button.
4. THE RDV_Toast SHALL auto-dismiss after 5 seconds if no action is taken.
5. WHEN the "Annuler" action is clicked, THE RDV_Toast SHALL dismiss immediately.
6. IF the undo operation fails, THEN THE RDV_Toast SHALL display an error message indicating the undo could not be completed.

### Requirement 8: Backend Scheduling Endpoint

**User Story:** As a developer, I want a dedicated scheduling endpoint that assigns a time slot to a pending radiology request, so that the frontend can persist drag-and-drop operations.

#### Acceptance Criteria

1. THE Backend SHALL expose a POST endpoint for scheduling a RadioDemande to a specific date and time.
2. WHEN a valid scheduling request is received, THE Backend SHALL update the RadioDemande with the scheduled date-time and transition its status from "pending" to "scheduled".
3. IF the RadioDemande status is not "pending", THEN THE Backend SHALL return a 409 Conflict response.
4. IF the requested time slot conflicts with an existing appointment for the same resource, THEN THE Backend SHALL return a 409 Conflict response with a descriptive message.
5. THE Backend SHALL expose a DELETE endpoint to undo a scheduling operation, transitioning the RadioDemande status from "scheduled" back to "pending" and clearing the scheduled date-time.
6. THE Backend SHALL expose a GET endpoint returning scheduled appointments for a given date range, including patient name, exam type, urgency, and scheduled time.
7. WHEN a "Passer sans RDV" action is received, THE Backend SHALL transition the RadioDemande status from "pending" to "in_progress" without assigning a scheduled date-time.

### Requirement 9: Component Architecture

**User Story:** As a developer, I want a well-structured component hierarchy following Angular standalone patterns, so that the codebase remains maintainable and testable.

#### Acceptance Criteria

1. THE RDV_Page SHALL be implemented as an Angular standalone component that composes the Pending_Requests_Panel and Calendar_Panel.
2. THE Pending_Requests_Panel SHALL be implemented as an Angular standalone component containing the Requests_Counter_Header and a list of Request_Card components.
3. THE Request_Card SHALL be implemented as an Angular standalone component accepting a RadioDemande input and emitting drag, delete, and bypass events.
4. THE Calendar_Panel SHALL be implemented as an Angular standalone component wrapping the FullCalendar library.
5. THE Drop_Zone_Indicator SHALL be implemented as an Angular standalone component that toggles visibility based on a drag-active input signal.
6. THE RDV_Toast SHALL be implemented as an Angular standalone component that accepts a message, action label, and emits action-clicked and dismissed events.
7. THE RadiologyRdvFacade SHALL be implemented as an injectable Angular service using signals or BehaviorSubjects for reactive state management.
