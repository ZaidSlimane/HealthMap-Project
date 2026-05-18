# Requirements Document

## Introduction

The Lab & Radiology module adds two parallel, symmetric sub-modules to HealthMap: Radiology and Laboratory. Both follow the same workflow pattern — a Doctor requests exams from the consultation screen, a Technician processes requests via a dedicated worklist, and the Doctor views results once available. Real-time WebSocket notifications keep all parties informed of status changes. The module integrates with the existing consultation flow, leverages legacy catalog tables (`radio_type`, `labo_billon`, `labo_analyse`, `labo_s_analyse`), and extends existing request/result tables while introducing new ones for lab demand management.

## Glossary

- **Doctor**: A user with the `Doctor` role who creates exam requests from the consultation screen and views results.
- **Radio_Technician**: A user with the `RadioTech` role who processes radiology requests via the radiology worklist.
- **Lab_Technician**: A user with the `LabTech` role who processes laboratory requests via the laboratory worklist.
- **Consultation**: An active patient encounter (stored in `consultations` table) from which exam requests originate.
- **Radio_Demande**: A radiology request record linking a consultation to one or more radiology exam types.
- **Radio_Resultat**: A radiology result record containing the uploaded file and report text for a completed radiology request.
- **Labo_Demande**: A laboratory request header record linking a consultation to a set of requested lab exams.
- **Labo_Demande_Item**: An individual exam or panel selected within a laboratory request.
- **Labo_Billon**: A laboratory panel (group of analyses), e.g., "Bilan rénal".
- **Labo_Analyse**: An individual laboratory analysis, e.g., "NFS".
- **Labo_S_Analyse**: A sub-analysis within a laboratory analysis, e.g., "Hémoglobine" under NFS.
- **Labo_Result**: A result record for a single sub-analysis containing numeric or text values.
- **Worklist**: A filtered, role-specific queue of pending exam requests awaiting processing.
- **Exam_Request_Modal**: The frontend dialog component used by Doctors to select and submit exam requests.
- **Result_Panel**: The frontend component displaying completed exam results within the consultation screen.
- **WebSocket_Event**: A real-time event broadcast via Laravel Reverb to notify users of request or result status changes.
- **Request_Status**: The lifecycle state of a request: `pending`, `in_progress`, `completed`, `cancelled`.

## Requirements

### Requirement 1: Radiology Request Creation

**User Story:** As a Doctor, I want to request radiology exams from the consultation screen, so that I can order imaging studies for my patient.

#### Acceptance Criteria

1. WHEN the Doctor clicks "Demande d'examen Radiologique" in the consultation sidebar, THE System SHALL open the Exam_Request_Modal displaying available radiology exam types from the `radiology_exam_types` catalog.
2. THE Exam_Request_Modal SHALL allow the Doctor to select one or more radiology exam types from the catalog.
3. THE Exam_Request_Modal SHALL allow the Doctor to set an urgency level (normale, urgente) for the request.
4. THE Exam_Request_Modal SHALL allow the Doctor to enter optional clinical notes for the request.
5. WHEN the Doctor submits the radiology request, THE System SHALL create a Radio_Demande record with: `id_con` (current consultation), `urgency`, `status` set to `pending`, `notes`, `requested_by` (Doctor user ID), and `created_at` timestamp.
6. WHEN the Doctor submits the radiology request, THE System SHALL associate each selected exam type with the Radio_Demande record.
7. IF the Doctor submits the request without selecting at least one exam type, THEN THE System SHALL display a validation error and prevent submission.
8. WHEN a Radio_Demande is successfully created, THE System SHALL broadcast a WebSocket_Event of type `ExamRequested` to the radiology channel.

### Requirement 2: Laboratory Request Creation

**User Story:** As a Doctor, I want to request laboratory exams from the consultation screen, so that I can order blood tests and other analyses for my patient.

#### Acceptance Criteria

1. WHEN the Doctor clicks "Demande d'examen Biologique" in the consultation sidebar, THE System SHALL open the Exam_Request_Modal displaying available laboratory panels (Labo_Billon) and individual analyses (Labo_Analyse).
2. THE Exam_Request_Modal SHALL allow the Doctor to select one or more panels or individual analyses.
3. WHEN the Doctor selects a panel, THE Exam_Request_Modal SHALL display the constituent analyses within that panel for informational purposes.
4. THE Exam_Request_Modal SHALL allow the Doctor to set an urgency level (normale, urgente) for the request.
5. THE Exam_Request_Modal SHALL allow the Doctor to enter optional clinical notes for the request.
6. WHEN the Doctor submits the laboratory request, THE System SHALL create a Labo_Demande record with: `id_con` (current consultation), `urgency`, `status` set to `pending`, `notes`, `requested_by` (Doctor user ID), and `created_at` timestamp.
7. WHEN the Doctor submits the laboratory request, THE System SHALL create one Labo_Demande_Item record per selected panel or individual analysis, linking to the Labo_Demande header.
8. IF the Doctor submits the request without selecting at least one exam, THEN THE System SHALL display a validation error and prevent submission.
9. WHEN a Labo_Demande is successfully created, THE System SHALL broadcast a WebSocket_Event of type `ExamRequested` to the laboratory channel.

### Requirement 3: Radiology Worklist

**User Story:** As a Radio Technician, I want to see a worklist of pending radiology requests, so that I can process them in order of priority.

#### Acceptance Criteria

1. WHEN the Radio_Technician navigates to the radiology worklist screen, THE System SHALL display all Radio_Demande records with status `pending` or `in_progress`.
2. THE Worklist SHALL display for each request: patient name, consultation date, requested exam types, urgency level, request status, and requesting Doctor name.
3. THE Worklist SHALL sort requests by urgency (urgente first) and then by creation date (oldest first).
4. THE Worklist SHALL allow the Radio_Technician to filter requests by status, urgency, and date range.
5. THE Worklist SHALL allow the Radio_Technician to search requests by patient name.
6. WHEN a new ExamRequested WebSocket_Event is received, THE Worklist SHALL update in real-time without requiring a page refresh.
7. WHEN the Radio_Technician clicks on a request, THE System SHALL navigate to the request detail screen showing patient information and requested exams.

### Requirement 4: Radiology Result Upload

**User Story:** As a Radio Technician, I want to upload radiology results (images and reports), so that the requesting Doctor can view them.

#### Acceptance Criteria

1. WHEN the Radio_Technician opens a radiology request detail, THE System SHALL display a result entry form with: file upload field and report text field (compte_rendu).
2. THE System SHALL accept file uploads in the following formats: PDF, JPEG, PNG, and DICOM (.dcm).
3. THE System SHALL enforce a maximum file size of 50 MB per uploaded file.
4. WHEN the Radio_Technician submits the result, THE System SHALL create a Radio_Resultat record with: `file_path` (stored on private disk), `compte_rendu` (report text), `performed_by` (Radio_Technician user ID), `status` set to `completed`, and `created_at` timestamp.
5. WHEN the Radio_Technician submits the result, THE System SHALL update the associated Radio_Demande status to `completed`.
6. WHEN a radiology result is successfully saved, THE System SHALL broadcast a WebSocket_Event of type `ResultReady` to the consultation channel for the requesting Doctor.
7. THE System SHALL store uploaded files on the Laravel private disk, preventing direct public URL access.
8. IF the file upload fails due to size or format violation, THEN THE System SHALL display a descriptive error message and prevent submission.
9. WHEN the Radio_Technician begins processing a request, THE System SHALL update the Radio_Demande status from `pending` to `in_progress`.

### Requirement 5: Laboratory Worklist

**User Story:** As a Lab Technician, I want to see a worklist of pending laboratory requests, so that I can process them in order of priority.

#### Acceptance Criteria

1. WHEN the Lab_Technician navigates to the laboratory worklist screen, THE System SHALL display all Labo_Demande records with status `pending` or `in_progress`.
2. THE Worklist SHALL display for each request: patient name, consultation date, requested panels and analyses, urgency level, request status, and requesting Doctor name.
3. THE Worklist SHALL sort requests by urgency (urgente first) and then by creation date (oldest first).
4. THE Worklist SHALL allow the Lab_Technician to filter requests by status, urgency, and date range.
5. THE Worklist SHALL allow the Lab_Technician to search requests by patient name.
6. WHEN a new ExamRequested WebSocket_Event is received, THE Worklist SHALL update in real-time without requiring a page refresh.
7. WHEN the Lab_Technician clicks on a request, THE System SHALL navigate to the request detail screen showing patient information and requested analyses with their sub-analyses.

### Requirement 6: Laboratory Result Entry

**User Story:** As a Lab Technician, I want to enter numeric and text results for each sub-analysis, so that the requesting Doctor can review the lab findings.

#### Acceptance Criteria

1. WHEN the Lab_Technician opens a laboratory request detail, THE System SHALL display a result entry form listing all Labo_S_Analyse items grouped by their parent Labo_Analyse.
2. THE result entry form SHALL display for each sub-analysis: the sub-analysis name, a numeric input field for the value, a text input field for qualitative results, and the reference range (normal values) for informational display.
3. WHEN the Lab_Technician submits results, THE System SHALL create one Labo_Result record per sub-analysis with: the entered numeric value, text value, `performed_by` (Lab_Technician user ID), and `created_at` timestamp.
4. WHEN all sub-analyses for a Labo_Demande have results entered, THE System SHALL update the Labo_Demande status to `completed`.
5. WHEN a laboratory result is successfully saved, THE System SHALL broadcast a WebSocket_Event of type `ResultReady` to the consultation channel for the requesting Doctor.
6. IF the Lab_Technician submits the form with empty required numeric fields, THEN THE System SHALL display a validation error indicating which sub-analyses are missing values.
7. WHEN the Lab_Technician begins processing a request, THE System SHALL update the Labo_Demande status from `pending` to `in_progress`.
8. THE System SHALL allow partial result entry, saving completed sub-analyses without requiring all sub-analyses to be filled at once.

### Requirement 7: Doctor Result Viewing — Radiology

**User Story:** As a Doctor, I want to view radiology results from the consultation screen, so that I can interpret imaging findings for my patient.

#### Acceptance Criteria

1. WHEN a ResultReady WebSocket_Event is received for the current consultation, THE System SHALL update the radiology result badge on the consultation sidebar to reflect the new result count.
2. WHEN the Doctor clicks the radiology results section in the consultation screen, THE Result_Panel SHALL display a list of completed Radio_Resultat records for the current patient.
3. THE Result_Panel SHALL display for each result: the exam type label, the report text (compte_rendu), the performing technician name, and the completion date.
4. THE Result_Panel SHALL provide a download link for the attached result file.
5. THE System SHALL serve result files through an authenticated endpoint, verifying the requesting user has Doctor or Admin role.
6. WHILE the consultation is active, THE System SHALL display a visual indicator (badge) on the sidebar showing the count of pending radiology requests and completed results.

### Requirement 8: Doctor Result Viewing — Laboratory

**User Story:** As a Doctor, I want to view laboratory results from the consultation screen, so that I can interpret lab findings for my patient.

#### Acceptance Criteria

1. WHEN a ResultReady WebSocket_Event is received for the current consultation, THE System SHALL update the laboratory result badge on the consultation sidebar to reflect the new result count.
2. WHEN the Doctor clicks the laboratory results section in the consultation screen, THE Result_Panel SHALL display completed Labo_Result records grouped by Labo_Analyse and Labo_S_Analyse.
3. THE Result_Panel SHALL display for each sub-analysis result: the sub-analysis name, the numeric value, the text value (if present), the reference range, and an abnormal flag when the value falls outside the reference range.
4. THE Result_Panel SHALL display the performing technician name and the completion date for each result set.
5. WHILE the consultation is active, THE System SHALL display a visual indicator (badge) on the sidebar showing the count of pending laboratory requests and completed results.

### Requirement 9: Request Cancellation

**User Story:** As a Doctor, I want to cancel a pending exam request, so that I can correct mistakes or respond to changed clinical circumstances.

#### Acceptance Criteria

1. WHILE a Radio_Demande or Labo_Demande has status `pending`, THE System SHALL allow the requesting Doctor to cancel the request.
2. WHEN the Doctor cancels a request, THE System SHALL update the request status to `cancelled` and record the cancellation timestamp.
3. IF a request has status `in_progress` or `completed`, THEN THE System SHALL prevent cancellation and display a message indicating the request is already being processed.
4. WHEN a request is cancelled, THE System SHALL broadcast a WebSocket_Event notifying the relevant technician worklist of the cancellation.

### Requirement 10: Real-Time Notifications

**User Story:** As a system user, I want real-time notifications when exam requests are created or results are ready, so that I can respond promptly without refreshing the page.

#### Acceptance Criteria

1. WHEN a Radio_Demande or Labo_Demande is created, THE System SHALL broadcast an `ExamRequested` event via Laravel Reverb to the appropriate technician channel (radiology or laboratory).
2. WHEN a Radio_Resultat or Labo_Result is completed, THE System SHALL broadcast a `ResultReady` event via Laravel Reverb to the consultation channel associated with the requesting Doctor.
3. THE WebSocket_Event payload SHALL include: request ID, patient name, exam type summary, urgency level, and event timestamp.
4. THE System SHALL use private channels authenticated via Laravel broadcasting, ensuring only authorized users receive events.
5. IF the WebSocket connection is lost, THEN THE System SHALL attempt automatic reconnection and refresh the worklist data upon reconnection.

### Requirement 11: Access Control and Role Permissions

**User Story:** As a system administrator, I want strict role-based access control for the Lab and Radiology modules, so that each user can only access their authorized functions.

#### Acceptance Criteria

1. THE System SHALL restrict radiology request creation to users with the `Doctor` or `Admin` role.
2. THE System SHALL restrict radiology worklist access and result upload to users with the `RadioTech` or `Admin` role.
3. THE System SHALL restrict laboratory request creation to users with the `Doctor` or `Admin` role.
4. THE System SHALL restrict laboratory worklist access and result entry to users with the `LabTech` or `Admin` role.
5. THE System SHALL restrict result file download to users with the `Doctor`, `RadioTech`, `LabTech`, or `Admin` role.
6. IF an unauthorized user attempts to access a restricted endpoint, THEN THE System SHALL return a 403 Forbidden response.
7. THE System SHALL enforce role checks via the existing `RoleMiddleware` on all Lab and Radiology API routes.

### Requirement 12: Database Schema — Radiology Extensions

**User Story:** As a developer, I want the radiology database schema extended to support the full request-result lifecycle, so that all data relationships are properly modeled.

#### Acceptance Criteria

1. THE System SHALL add the following columns to the `radio_demande` table: `id_con` (FK to consultations), `urgency` (enum: normale, urgente), `status` (enum: pending, in_progress, completed, cancelled), `notes` (text, nullable), `requested_by` (FK to users), `created_at`, and `updated_at`.
2. THE System SHALL add the following columns to the `radio_resultat` table: `file_path` (string, nullable), `compte_rendu` (text, nullable), `performed_by` (FK to users), `status` (enum: pending, completed), `created_at`, and `updated_at`.
3. THE System SHALL create a `radio_demande_items` pivot table with columns: `id`, `radio_demande_id` (FK to radio_demande), `radiology_exam_type_id` (FK to radiology_exam_types), `created_at`, and `updated_at`.
4. THE System SHALL add appropriate indexes on `radio_demande.id_con`, `radio_demande.status`, and `radio_demande.requested_by` for query performance.

### Requirement 13: Database Schema — Laboratory Extensions

**User Story:** As a developer, I want the laboratory database schema created and extended to support the full request-result lifecycle, so that all data relationships are properly modeled.

#### Acceptance Criteria

1. THE System SHALL create a `labo_demande` table with columns: `id`, `id_con` (FK to consultations), `urgency` (enum: normale, urgente), `status` (enum: pending, in_progress, completed, cancelled), `notes` (text, nullable), `requested_by` (FK to users), `created_at`, and `updated_at`.
2. THE System SHALL create a `labo_demande_item` table with columns: `id`, `labo_demande_id` (FK to labo_demande), `labo_billon_id` (FK to labo_billon, nullable), `labo_analyse_id` (FK to labo_analyse, nullable), `type` (enum: panel, analysis), `created_at`, and `updated_at`.
3. THE System SHALL add the following columns to the `labo_result` table: `performed_by` (FK to users), `labo_demande_id` (FK to labo_demande), `created_at`, and `updated_at`.
4. THE System SHALL add appropriate indexes on `labo_demande.id_con`, `labo_demande.status`, and `labo_demande.requested_by` for query performance.
5. THE System SHALL enforce that each Labo_Demande_Item references either a `labo_billon_id` or a `labo_analyse_id`, but not both simultaneously.

### Requirement 14: Backend API Endpoints

**User Story:** As a frontend developer, I want dedicated API endpoints for the Lab and Radiology modules, so that the frontend components can retrieve and mutate data.

#### Acceptance Criteria

1. THE System SHALL expose `POST /api/radiology/requests` for creating radiology requests, accepting: consultation ID, array of exam type IDs, urgency, and notes.
2. THE System SHALL expose `GET /api/radiology/requests` for listing radiology requests, supporting filters: status, urgency, date range, and patient search.
3. THE System SHALL expose `GET /api/radiology/requests/{id}` for retrieving a single radiology request with its associated exam types and patient details.
4. THE System SHALL expose `POST /api/radiology/requests/{id}/result` for uploading radiology results, accepting: file upload and report text.
5. THE System SHALL expose `GET /api/radiology/results/{id}/download` for downloading result files with authentication verification.
6. THE System SHALL expose `POST /api/laboratory/requests` for creating laboratory requests, accepting: consultation ID, array of item objects (type + ID), urgency, and notes.
7. THE System SHALL expose `GET /api/laboratory/requests` for listing laboratory requests, supporting filters: status, urgency, date range, and patient search.
8. THE System SHALL expose `GET /api/laboratory/requests/{id}` for retrieving a single laboratory request with its items, analyses, and sub-analyses.
9. THE System SHALL expose `POST /api/laboratory/requests/{id}/results` for submitting laboratory results, accepting: array of sub-analysis results (sub_analysis_id, numeric_value, text_value).
10. THE System SHALL expose `PATCH /api/radiology/requests/{id}/cancel` and `PATCH /api/laboratory/requests/{id}/cancel` for cancelling pending requests.
11. THE System SHALL expose `GET /api/radiology/exam-types` for retrieving the radiology exam type catalog.
12. THE System SHALL expose `GET /api/laboratory/catalog` for retrieving the laboratory catalog (panels, analyses, and sub-analyses).

### Requirement 15: Frontend Module Structure and Routing

**User Story:** As a developer, I want dedicated Angular modules for Lab and Radiology, so that the features are isolated and maintainable.

#### Acceptance Criteria

1. THE System SHALL create a `radiology/` feature directory containing: worklist component, request detail component, and result upload component.
2. THE System SHALL create a `laboratory/` feature directory containing: worklist component, request detail component, and result entry component.
3. THE System SHALL implement the Exam_Request_Modal as a shared component usable from the consultation screen for both radiology and laboratory requests.
4. THE System SHALL implement all components as Angular 17 standalone components using signals.
5. THE System SHALL register route guards on radiology routes restricting access to `RadioTech` and `Admin` roles.
6. THE System SHALL register route guards on laboratory routes restricting access to `LabTech` and `Admin` roles.
7. THE System SHALL integrate the Result_Panel into the existing consultation component as a sidebar section accessible to Doctors.
8. THE System SHALL create Angular services (`RadioService`, `LaboService`) encapsulating all HTTP calls and WebSocket subscriptions for their respective modules.
