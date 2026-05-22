# Implementation Plan: Lab & Radiology Module

## Overview

This plan implements the Lab & Radiology module for HealthMap following a symmetric architecture. The implementation proceeds in layers: database migrations first, then backend models/services/controllers, then frontend services/components, and finally real-time WebSocket integration. Both radiology and laboratory sub-modules are built in parallel where possible due to their symmetric design.

## Tasks

- [x] 1. Database migrations and schema setup
  - [x] 1.1 Create migration to extend `radio_demande` table
    - Add columns: `id_con` (FK → consultations), `urgency` (enum: normale, urgente), `status` (enum: pending, in_progress, completed, cancelled), `notes` (text nullable), `requested_by` (FK → users), `cancelled_at` (timestamp nullable), `created_at`, `updated_at`
    - Add indexes on `id_con`, `status`, `requested_by`
    - _Requirements: 12.1, 12.4_

  - [x] 1.2 Create migration for `radio_demande_items` pivot table
    - Create table with: `id`, `radio_demande_id` (FK → radio_demande, ON DELETE CASCADE), `radiology_exam_type_id` (FK → radiology_exam_types), `created_at`, `updated_at`
    - _Requirements: 12.3_

  - [x] 1.3 Create migration to extend `radio_resultat` table
    - Add columns: `radio_demande_id` (FK → radio_demande), `file_path` (string 500, nullable), `compte_rendu` (text nullable), `performed_by` (FK → users), `status` (enum: pending, completed), `created_at`, `updated_at`
    - _Requirements: 12.2_

  - [x] 1.4 Create migration for `labo_demande` table
    - Create table with: `id`, `id_con` (FK → consultations), `urgency` (enum: normale, urgente), `status` (enum: pending, in_progress, completed, cancelled), `notes` (text nullable), `requested_by` (FK → users), `cancelled_at` (timestamp nullable), `created_at`, `updated_at`
    - Add indexes on `id_con`, `status`, `requested_by`
    - _Requirements: 13.1, 13.4_

  - [x] 1.5 Create migration for `labo_demande_item` table
    - Create table with: `id`, `labo_demande_id` (FK → labo_demande, ON DELETE CASCADE), `labo_billon_id` (FK → labo_billon, nullable), `labo_analyse_id` (FK → labo_analyse, nullable), `type` (enum: panel, analysis), `created_at`, `updated_at`
    - Add CHECK constraint enforcing XOR on `labo_billon_id` / `labo_analyse_id`
    - _Requirements: 13.2, 13.5_

  - [x] 1.6 Create migration to extend `labo_result` table
    - Add columns: `labo_demande_id` (FK → labo_demande), `performed_by` (FK → users), `created_at`, `updated_at`
    - _Requirements: 13.3_

- [x] 2. Backend Eloquent models
  - [x] 2.1 Create `RadioDemande` model
    - Define table, fillable, casts (urgency, status as enums), relationships: belongsTo Consultation, belongsTo User (requestedBy), hasMany RadioDemandeItem, hasOne RadioResultat
    - Add scope methods for status filtering
    - _Requirements: 12.1, 3.1, 5.1_

  - [x] 2.2 Create `RadioDemandeItem` model
    - Define table, fillable, relationships: belongsTo RadioDemande, belongsTo RadiologyExamType
    - _Requirements: 12.3_

  - [x] 2.3 Create `RadioResultat` model
    - Define table, fillable, casts, relationships: belongsTo RadioDemande, belongsTo User (performedBy)
    - _Requirements: 12.2_

  - [x] 2.4 Create `LaboDemande` model
    - Define table, fillable, casts (urgency, status as enums), relationships: belongsTo Consultation, belongsTo User (requestedBy), hasMany LaboDemandeItem, hasMany LaboResult
    - Add scope methods for status filtering
    - _Requirements: 13.1, 5.1_

  - [x] 2.5 Create `LaboDemandeItem` model
    - Define table, fillable, casts, relationships: belongsTo LaboDemande, belongsTo LaboBillon (nullable), belongsTo LaboAnalyse (nullable)
    - _Requirements: 13.2_

  - [x] 2.6 Create `LaboResult` model
    - Define table, fillable, casts, relationships: belongsTo LaboDemande, belongsTo LaboSAnalyse, belongsTo User (performedBy)
    - _Requirements: 13.3_

- [x] 3. Backend services and business logic
  - [x] 3.1 Create `RadioRequestService`
    - Implement `createRequest(consultationId, examTypeIds, urgency, notes, userId)`: creates RadioDemande + items, validates state, returns model
    - Implement `startProcessing(radioDemande, userId)`: transitions pending → in_progress
    - Implement `cancel(radioDemande, userId)`: transitions pending → cancelled, sets cancelled_at; rejects if not pending (throws domain exception)
    - _Requirements: 1.5, 1.6, 4.9, 9.1, 9.2, 9.3_

  - [x] 3.2 Create `RadioResultService`
    - Implement `uploadResult(radioDemande, file, compteRendu, userId)`: stores file on private disk, creates RadioResultat, transitions demande to completed
    - _Requirements: 4.4, 4.5, 4.7_

  - [x] 3.3 Create `LaboRequestService`
    - Implement `createRequest(consultationId, items, urgency, notes, userId)`: creates LaboDemande + items with XOR validation, returns model
    - Implement `startProcessing(laboDemande, userId)`: transitions pending → in_progress
    - Implement `cancel(laboDemande, userId)`: transitions pending → cancelled, sets cancelled_at; rejects if not pending
    - _Requirements: 2.6, 2.7, 6.7, 9.1, 9.2, 9.3_

  - [x] 3.4 Create `LaboResultService`
    - Implement `submitResults(laboDemande, results, userId)`: creates LaboResult records per sub-analysis, checks if all sub-analyses complete → transitions to completed, otherwise keeps in_progress
    - _Requirements: 6.3, 6.4, 6.8_

  - [x] 3.5 Create `ExamNotificationService`
    - Implement `notifyExamRequested(type, request)`: dispatches ExamRequested event to radiology/laboratory channel
    - Implement `notifyResultReady(type, request)`: dispatches ResultReady event to consultation channel
    - Implement `notifyRequestCancelled(type, request)`: dispatches RequestCancelled event to technician channel
    - _Requirements: 1.8, 2.9, 4.6, 6.5, 9.4, 10.1, 10.2, 10.3_

- [x] 4. Backend events and broadcasting
  - [x] 4.1 Create `ExamRequested` event class
    - Implement ShouldBroadcast, define broadcastOn (private channel: radiology or laboratory), broadcastWith payload: request_id, patient_name, exam_summary, urgency, timestamp
    - _Requirements: 10.1, 10.3, 10.4_

  - [x] 4.2 Create `ResultReady` event class
    - Implement ShouldBroadcast, define broadcastOn (private channel: consultation.{id}), broadcastWith payload: request_id, patient_name, exam_summary, urgency, timestamp
    - _Requirements: 10.2, 10.3, 10.4_

  - [x] 4.3 Create `RequestCancelled` event class
    - Implement ShouldBroadcast, define broadcastOn (private channel: radiology or laboratory), broadcastWith payload: request_id, patient_name, timestamp
    - _Requirements: 9.4, 10.3, 10.4_

  - [x] 4.4 Register private channel authorization in `channels.php`
    - Add authorization callbacks for `radiology`, `laboratory`, and `consultation.{id}` channels verifying user roles
    - _Requirements: 10.4_

- [x] 5. Backend form requests (validation)
  - [x] 5.1 Create `StoreRadioRequestRequest`
    - Validate: consultation_id exists in consultations, exam_type_ids required array of valid radiology_exam_types IDs, urgency in [normale, urgente], notes optional string
    - _Requirements: 1.5, 1.7, 14.1_

  - [x] 5.2 Create `StoreLaboRequestRequest`
    - Validate: consultation_id exists in consultations, items required non-empty array with type (panel|analysis) and id valid, urgency in [normale, urgente], notes optional string
    - _Requirements: 2.6, 2.8, 14.6_

  - [x] 5.3 Create `StoreRadioResultRequest`
    - Validate: file required with mimes (pdf, jpeg, jpg, png, dcm) max 51200 KB, compte_rendu optional string
    - _Requirements: 4.2, 4.3, 4.8, 14.4_

  - [x] 5.4 Create `StoreLaboResultRequest`
    - Validate: results required array, each with sub_analysis_id valid in labo_s_analyse, numeric_value required numeric, text_value optional string
    - _Requirements: 6.3, 6.6, 14.9_

- [x] 6. Checkpoint - Backend foundation
  - Ensure all migrations run successfully, models load, and services are instantiable. Ask the user if questions arise.

- [x] 7. Backend controllers and routes
  - [x] 7.1 Create `RadioCatalogController`
    - Implement `index()`: returns radiology_exam_types catalog list
    - _Requirements: 14.11_

  - [x] 7.2 Create `LaboCatalogController`
    - Implement `index()`: returns panels (labo_billon) with nested analyses and sub-analyses
    - _Requirements: 14.12_

  - [x] 7.3 Create `RadioRequestController`
    - Implement `store()`: uses StoreRadioRequestRequest + RadioRequestService, dispatches ExamRequested event
    - Implement `index()`: returns filtered worklist (status, urgency, date range, patient search)
    - Implement `show()`: returns request detail with exam types and patient info
    - Implement `start()`: transitions to in_progress
    - Implement `cancel()`: cancels pending request, returns 409 if not pending
    - _Requirements: 14.1, 14.2, 14.3, 14.10, 3.1, 3.4, 3.5, 9.1, 9.3_

  - [x] 7.4 Create `RadioResultController`
    - Implement `store()`: uses StoreRadioResultRequest + RadioResultService, dispatches ResultReady event
    - Implement `download()`: serves file from private disk with auth check
    - _Requirements: 14.4, 14.5, 7.5_

  - [x] 7.5 Create `LaboRequestController`
    - Implement `store()`: uses StoreLaboRequestRequest + LaboRequestService, dispatches ExamRequested event
    - Implement `index()`: returns filtered worklist
    - Implement `show()`: returns request detail with items, analyses, sub-analyses
    - Implement `start()`: transitions to in_progress
    - Implement `cancel()`: cancels pending request, returns 409 if not pending
    - _Requirements: 14.6, 14.7, 14.8, 14.10, 5.1, 5.4, 5.5, 9.1, 9.3_

  - [x] 7.6 Create `LaboResultController`
    - Implement `store()`: uses StoreLaboResultRequest + LaboResultService, dispatches ResultReady event when complete
    - _Requirements: 14.9, 6.3, 6.4, 6.5_

  - [x] 7.7 Register API routes with RoleMiddleware
    - Create `routes/radiology.php`: group with prefix `api/radiology`, apply RoleMiddleware per endpoint (Doctor/Admin for creation, RadioTech/Admin for worklist/result)
    - Create `routes/laboratory.php`: group with prefix `api/laboratory`, apply RoleMiddleware per endpoint (Doctor/Admin for creation, LabTech/Admin for worklist/result)
    - Register route files in RouteServiceProvider
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [x] 8. Checkpoint - Backend API complete
  - Ensure all API endpoints respond correctly, role middleware blocks unauthorized access, and events broadcast. Ask the user if questions arise.

- [ ] 9. Backend property-based tests
  - [ ]* 9.1 Write property test for request creation invariant
    - **Property 1: Request creation invariant**
    - **Validates: Requirements 1.5, 2.6**

  - [ ]* 9.2 Write property test for item association completeness
    - **Property 2: Item association completeness**
    - **Validates: Requirements 1.6, 2.7**

  - [ ]* 9.3 Write property test for worklist status filtering
    - **Property 3: Worklist status filtering**
    - **Validates: Requirements 3.1, 5.1**

  - [ ]* 9.4 Write property test for worklist sorting by urgency and date
    - **Property 4: Worklist sorting by urgency and date**
    - **Validates: Requirements 3.3, 5.3**

  - [ ]* 9.5 Write property test for worklist filtering and search
    - **Property 5: Worklist filtering and search**
    - **Validates: Requirements 3.4, 3.5, 5.4, 5.5**

  - [ ]* 9.6 Write property test for file format validation
    - **Property 6: File format validation**
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 9.7 Write property test for request status lifecycle transitions
    - **Property 7: Request status lifecycle transitions**
    - **Validates: Requirements 4.5, 4.9, 6.4, 6.7, 9.1, 9.2, 9.3**

  - [ ]* 9.8 Write property test for partial result entry preserves in_progress status
    - **Property 8: Partial result entry preserves in_progress status**
    - **Validates: Requirements 6.8**

  - [ ]* 9.9 Write property test for abnormal flag correctness
    - **Property 9: Abnormal flag correctness**
    - **Validates: Requirements 8.3**

  - [ ]* 9.10 Write property test for cancellation state guard
    - **Property 10: Cancellation state guard**
    - **Validates: Requirements 9.1, 9.2, 9.3**

  - [ ]* 9.11 Write property test for role-based access control
    - **Property 11: Role-based access control**
    - **Validates: Requirements 7.5, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6**

  - [ ]* 9.12 Write property test for Labo_Demande_Item XOR constraint
    - **Property 12: Labo_Demande_Item XOR constraint**
    - **Validates: Requirements 13.5**

  - [ ]* 9.13 Write property test for event payload completeness
    - **Property 13: Event payload completeness**
    - **Validates: Requirements 10.3**

- [x] 10. Frontend Angular services
  - [x] 10.1 Create `ExamWebSocketService`
    - Manage Laravel Reverb WebSocket connection, channel subscriptions (radiology, laboratory, consultation.{id}), exponential backoff reconnection (1s, 2s, 4s, 8s, max 30s), emit typed observables for events
    - _Requirements: 10.4, 10.5_

  - [x] 10.2 Create `RadioService`
    - HTTP methods: getExamTypes(), createRequest(), getWorklist(filters), getRequestDetail(id), startProcessing(id), uploadResult(id, file, compteRendu), downloadResult(id), cancelRequest(id)
    - WebSocket subscription for radiology channel events
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.10, 14.11, 15.8_

  - [x] 10.3 Create `LaboService`
    - HTTP methods: getCatalog(), createRequest(), getWorklist(filters), getRequestDetail(id), startProcessing(id), submitResults(id, results), cancelRequest(id)
    - WebSocket subscription for laboratory channel events
    - _Requirements: 14.6, 14.7, 14.8, 14.9, 14.10, 14.12, 15.8_

- [x] 11. Frontend shared components
  - [x] 11.1 Create `ExamRequestModalComponent`
    - Standalone Angular 17 component with signals
    - Accept mode input ('radiology' | 'laboratory') to determine catalog source
    - Display catalog items with multi-select (checkboxes), urgency selector (normale/urgente), notes textarea
    - For laboratory mode: show panel expansion with constituent analyses
    - Validate at least one item selected before submission
    - Call RadioService or LaboService based on mode
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 2.8, 15.3_

- [x] 12. Frontend radiology feature components
  - [x] 12.1 Create `RadioWorklistComponent`
    - Standalone component with signals, display worklist table with columns: patient name, consultation date, exam types, urgency, status, doctor name
    - Implement filters: status dropdown, urgency dropdown, date range picker, patient name search
    - Subscribe to ExamWebSocketService for real-time updates (add new requests, remove cancelled)
    - Sort by urgency (urgente first) then created_at ascending
    - Navigate to detail on row click
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 15.1_

  - [x] 12.2 Create `RadioRequestDetailComponent`
    - Display patient info, requested exam types, urgency, notes, status
    - Show result upload form: file input (accept pdf,jpeg,png,dcm), compte_rendu textarea
    - "Start Processing" button to transition pending → in_progress
    - File upload with progress indicator, validation errors inline
    - Submit result triggers RadioService.uploadResult()
    - _Requirements: 4.1, 4.2, 4.3, 4.8, 4.9, 15.1_

  - [x] 12.3 Create `RadioResultPanelComponent`
    - Sidebar panel in consultation screen showing completed radiology results
    - Display: exam type label, compte_rendu text, technician name, completion date, download link
    - Badge showing pending request count and completed result count
    - Subscribe to ResultReady events for real-time badge/list updates
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6, 15.7_

- [x] 13. Frontend laboratory feature components
  - [x] 13.1 Create `LaboWorklistComponent`
    - Standalone component with signals, display worklist table with columns: patient name, consultation date, panels/analyses, urgency, status, doctor name
    - Implement filters: status dropdown, urgency dropdown, date range picker, patient name search
    - Subscribe to ExamWebSocketService for real-time updates
    - Sort by urgency (urgente first) then created_at ascending
    - Navigate to detail on row click
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 15.2_

  - [x] 13.2 Create `LaboRequestDetailComponent`
    - Display patient info, requested items grouped by analyse, sub-analyses with input fields
    - Show result entry form: numeric input + text input per sub-analysis, display reference ranges
    - "Start Processing" button to transition pending → in_progress
    - Allow partial submission (save filled sub-analyses)
    - Validation: required numeric fields highlighted on error
    - _Requirements: 6.1, 6.2, 6.3, 6.6, 6.7, 6.8, 15.2_

  - [x] 13.3 Create `LaboResultPanelComponent`
    - Sidebar panel in consultation screen showing completed lab results
    - Display results grouped by Labo_Analyse → Labo_S_Analyse: name, numeric value, text value, reference range, abnormal flag
    - Show technician name and completion date
    - Badge showing pending request count and completed result count
    - Subscribe to ResultReady events for real-time badge/list updates
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 15.7_

- [x] 14. Frontend routing and integration
  - [x] 14.1 Configure radiology routes and guards
    - Add lazy-loaded routes under `/radiology` path: worklist, detail/:id
    - Apply role guard restricting to RadioTech and Admin roles
    - _Requirements: 15.5_

  - [x] 14.2 Configure laboratory routes and guards
    - Add lazy-loaded routes under `/laboratory` path: worklist, detail/:id
    - Apply role guard restricting to LabTech and Admin roles
    - _Requirements: 15.6_

  - [x] 14.3 Integrate ExamRequestModal and ResultPanels into consultation component
    - Add "Demande d'examen Radiologique" and "Demande d'examen Biologique" buttons to consultation sidebar
    - Wire buttons to open ExamRequestModalComponent with appropriate mode
    - Add RadioResultPanelComponent and LaboResultPanelComponent to consultation sidebar
    - Add cancellation button for pending requests in result panels
    - _Requirements: 1.1, 2.1, 9.1, 15.3, 15.7_

- [x] 15. Checkpoint - Full integration
  - Ensure all frontend components render, API calls succeed, WebSocket events propagate, and role guards block unauthorized access. Ask the user if questions arise.

- [ ] 16. Backend feature tests
  - [ ]* 16.1 Write feature tests for radiology request creation and worklist
    - Test successful creation, validation errors, worklist filtering, role restrictions
    - _Requirements: 1.5, 1.7, 3.1, 3.4, 11.1, 11.2_

  - [ ]* 16.2 Write feature tests for radiology result upload and download
    - Test successful upload, file format/size validation, download auth check, status transition
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 7.5, 11.5_

  - [ ]* 16.3 Write feature tests for laboratory request creation and worklist
    - Test successful creation, XOR validation, worklist filtering, role restrictions
    - _Requirements: 2.6, 2.8, 5.1, 5.4, 11.3, 11.4, 13.5_

  - [ ]* 16.4 Write feature tests for laboratory result entry
    - Test partial and complete result submission, status transitions, validation
    - _Requirements: 6.3, 6.4, 6.6, 6.8_

  - [ ]* 16.5 Write feature tests for request cancellation
    - Test successful cancellation of pending, rejection of in_progress/completed, event broadcast
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 17. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The symmetric architecture means radiology and laboratory tasks can often be implemented in parallel
- All frontend components use Angular 17 standalone components with signals
- Backend follows existing modular structure under `Backend/app/Modules/ClinicalCore/`
- WebSocket events use Laravel Reverb with private channels

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.4"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.5", "1.6"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6"] },
    { "id": 3, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5"] },
    { "id": 4, "tasks": ["4.1", "4.2", "4.3", "4.4", "5.1", "5.2", "5.3", "5.4"] },
    { "id": 5, "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5", "7.6", "7.7"] },
    { "id": 6, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5", "9.6", "9.7", "9.8", "9.9", "9.10", "9.11", "9.12", "9.13", "10.1"] },
    { "id": 7, "tasks": ["10.2", "10.3"] },
    { "id": 8, "tasks": ["11.1"] },
    { "id": 9, "tasks": ["12.1", "12.2", "12.3", "13.1", "13.2", "13.3"] },
    { "id": 10, "tasks": ["14.1", "14.2", "14.3"] },
    { "id": 11, "tasks": ["16.1", "16.2", "16.3", "16.4", "16.5"] }
  ]
}
```
