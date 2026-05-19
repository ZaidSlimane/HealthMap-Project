# Implementation Plan: Patient Dossier

## Overview

This plan implements the Patient Dossier feature — a comprehensive medical record view for admitted patients. The implementation proceeds from backend models/endpoints, through shared UI components, to the full Angular page with its child components and tabs. Each task builds incrementally so that no code is orphaned.

## Tasks

- [x] 1. Backend models, migration, and aggregated endpoint
  - [x] 1.1 Create VitalSign and VitalSignType Eloquent models
    - Create `app/Modules/ClinicalCore/Models/VitalSign.php` with fillable fields (`vital_sign_type_id`, `admission_id`, `patient_id`, `value`, `measured_at`, `measured_by`) and relationships (`belongsTo` VitalSignType, Admission, Patient, User)
    - Create `app/Modules/ClinicalCore/Models/VitalSignType.php` with fillable fields (`label`, `unit`, `icon`, `color`, `sort_order`)
    - _Requirements: 5.1, 5.3, 5.4_

  - [x] 1.2 Create observation type migration
    - Add migration to add `type` column (VARCHAR 20, default 'medical') to `observations` table
    - Add index `idx_observations_type` on the `type` column
    - _Requirements: 8.1_

  - [x] 1.3 Create DossierController with aggregated endpoint
    - Create `app/Modules/ClinicalCore/Controllers/DossierController.php`
    - Implement `show($id)` method that returns admission with eager-loaded: patient, service, bed.room.unit, companion, companions, latestVitalSigns (most recent per type), admissionHistory (all admissions for same patient)
    - Register route `GET /api/clinical-core/admissions/{id}/dossier`
    - _Requirements: 1.2, 10.1, 10.2_

  - [x] 1.4 Create VitalSignController with index and store endpoints
    - Create `app/Modules/ClinicalCore/Controllers/VitalSignController.php`
    - Implement `index` (filter by `admission_id`) and `store` (validate and persist new measurement)
    - Add validation rules: required numeric value, valid vital_sign_type_id, valid admission_id
    - Register routes `GET /api/clinical-core/vital-signs` and `POST /api/clinical-core/vital-signs`
    - _Requirements: 5.1, 5.4, 5.6_

  - [ ]* 1.5 Write unit tests for DossierController and VitalSignController
    - Test DossierController returns correct eager-loaded relationships
    - Test VitalSignController validates input and rejects invalid values
    - Test VitalSignController store persists measurement correctly
    - _Requirements: 1.2, 5.4, 5.6_

- [x] 2. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Shared InlineEditComponent
  - [x] 3.1 Create InlineEditComponent
    - Create `frontend/src/app/shared/ui/inline-edit/inline-edit.component.ts` as a standalone Angular component
    - Implement view mode (displays text), edit mode (text input on click), confirm on Enter/blur, cancel on Escape
    - Emit `confirmed` event with new value, `cancelled` event on escape
    - Accept `value` input signal, `loading` input signal to disable during save
    - _Requirements: 11.1, 11.2, 11.3, 11.5_

  - [ ]* 3.2 Write unit tests for InlineEditComponent
    - Test click transitions to edit mode
    - Test Enter key emits confirmed event
    - Test Escape key reverts value
    - Test loading state disables input
    - _Requirements: 11.1, 11.2, 11.3, 11.5_

- [x] 4. DossierPageComponent and layout structure
  - [x] 4.1 Create DossierPageComponent with data loading
    - Create `frontend/src/app/features/services/dossier/dossier-page.component.ts` as standalone component
    - Inject `ActivatedRoute` to read `admissionId` param
    - Implement primary data load via `GET /admissions/:id/dossier` with loading/error signals
    - Implement parallel secondary data loading (vital signs, observations, movements, exam requests) via `forkJoin` after primary load completes
    - Define layout template with top banner, left sidebar, and main tabbed area slots
    - _Requirements: 1.2, 10.1, 10.2, 10.3, 10.4_

  - [x] 4.2 Register route and replace existing admission-resume component
    - Update the service routing module to point `/services/:serviceId/admission/:admissionId` to `DossierPageComponent`
    - Add role guard for Doctor and Admin roles
    - Remove or deprecate the old `AdmissionResumeComponent` reference
    - _Requirements: 1.1, 1.4_

  - [ ]* 4.3 Write unit tests for DossierPageComponent data loading
    - Test primary data load triggers on init with correct admission ID
    - Test secondary data loads in parallel after primary completes
    - Test error state when admission ID is invalid (404)
    - Test loading indicator shown during primary load
    - _Requirements: 1.2, 1.5, 10.1, 10.2, 10.3_

- [x] 5. TopBannerComponent
  - [x] 5.1 Create TopBannerComponent
    - Create `frontend/src/app/features/services/dossier/top-banner.component.ts` as standalone component
    - Accept `dossierData` input signal with patient, admission, service, bed info
    - Display four colored cards: green (patient name, DOB, computed age), orange (admission number, date), blue (service name, bed number), navigation button ("Revenir au service")
    - Implement age computation as a pure function: `computeAge(dateOfBirth: string): number`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 5.2 Write property test for age computation
    - **Property 1: Age computation correctness**
    - **Validates: Requirements 2.1**
    - Use `fast-check` to generate random valid dates of birth and verify `computeAge` returns floor of year difference accounting for birthday occurrence this year

  - [ ]* 5.3 Write unit tests for TopBannerComponent
    - Test all four cards render with correct data
    - Test "Revenir au service" button navigates to `/services/:serviceId`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6. LeftSidebarComponent
  - [x] 6.1 Create LeftSidebarComponent
    - Create `frontend/src/app/features/services/dossier/left-sidebar.component.ts` as standalone component
    - Accept inputs: patient, admission, companion, companions, examRequests, admissionHistory
    - Display sections: photo placeholder, blood group, emergency contact, treating doctor, motif d'admission (using InlineEditComponent), garde malade list, action buttons (Crypter/Décrypter, Partager), exam/bilan requests, admission history, centre d'impression
    - Wire InlineEditComponent confirmed event to PATCH `/admissions/:id` with optimistic UI and rollback on failure
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 11.3, 11.4_

  - [ ]* 6.2 Write property test for admission history ordering
    - **Property 11: Admission history descending order**
    - **Validates: Requirements 13.1**
    - Use `fast-check` to generate arrays of admission objects with random dates and verify the sort function produces descending date order

  - [ ]* 6.3 Write property test for actions dropdown visibility
    - **Property 10: Actions dropdown visibility tied to admission status**
    - **Validates: Requirements 9.1, 9.4**
    - Use `fast-check` to generate admission status values and verify visibility function returns true only for "active"

  - [ ]* 6.4 Write unit tests for LeftSidebarComponent
    - Test motif edit triggers PATCH and updates on success
    - Test motif edit reverts on PATCH failure
    - Test exam requests display with status indicators
    - Test admission history renders and highlights current admission
    - _Requirements: 3.5, 3.6, 11.3, 11.4, 12.1, 12.3, 13.1, 13.2_

- [x] 7. ActionsDropdownComponent
  - [x] 7.1 Create ActionsDropdownComponent
    - Create `frontend/src/app/features/services/dossier/actions-dropdown.component.ts` as standalone component
    - Accept `admissionStatus` input signal
    - Conditionally render dropdown only when status is "active"
    - Display menu items: Demander un examen radiologique, Demander un bilan biologique, Demander un acte, Prescrire un médicament, Transfert inter-service, Gestion des gardes malade, Gestion Fichier, Demander un avis spécialisé, Sortie médicale
    - Emit `actionSelected` event with action identifier
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 8. Checkpoint - Page shell and sidebar complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. MainTabbedAreaComponent and ResumeTab
  - [x] 9.1 Create MainTabbedAreaComponent
    - Create `frontend/src/app/features/services/dossier/main-tabbed-area.component.ts` as standalone component
    - Implement tab container with four tabs: Résumé, Fiche de Traitement, Parcours, Observation Paramedical
    - Manage active tab state via signal
    - Conditionally render tab content components based on active tab
    - _Requirements: 4.1_

  - [x] 9.2 Create ResumeTabComponent with three-column layout
    - Create `frontend/src/app/features/services/dossier/tabs/resume-tab.component.ts` as standalone component
    - Implement three-column layout: left (Feuilles de flux, Diagnostic, Bilan psychologique, Antécédents médicaux, Fichiers), center (Observations médicales, Allergies, Médicaments), right (Vital_Signs_Panel, Acte chirurgical, Rendez-vous)
    - Display empty-state messages for sections with no data
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 10. VitalSignsPanelComponent
  - [x] 10.1 Create VitalSignsPanelComponent
    - Create `frontend/src/app/features/services/dossier/tabs/vital-signs-panel.component.ts` as standalone component
    - Accept `vitalSigns` input signal (array of VitalSign with type info)
    - Display most recent value for each type (temperature, height, weight, pulse, blood pressure, glycemia)
    - Implement `computeIMC(heightCm: number, weightKg: number): number` pure function (rounded to 1 decimal)
    - Implement `selectMostRecent(signs: VitalSign[], typeId: number): VitalSign | null` pure function
    - Provide input fields for each vital sign type with client-side validation (numeric, physiological range)
    - On submit, POST to `/vital-signs` endpoint; on success update displayed value via signal
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 10.2 Write property test for IMC computation
    - **Property 3: IMC computation correctness**
    - **Validates: Requirements 5.2**
    - Use `fast-check` to generate positive height (cm) and weight (kg) values and verify `computeIMC` equals `weight / (height/100)²` rounded to 1 decimal

  - [ ]* 10.3 Write property test for most recent vital sign selection
    - **Property 2: Most recent vital sign selection**
    - **Validates: Requirements 5.1**
    - Use `fast-check` to generate arrays of VitalSign objects with random `measured_at` timestamps and verify `selectMostRecent` returns the one with maximum timestamp

  - [ ]* 10.4 Write property test for vital sign validation
    - **Property 4: Vital sign validation rejects invalid inputs**
    - **Validates: Requirements 5.6**
    - Use `fast-check` to generate non-numeric strings and out-of-range numbers and verify validation function returns error

  - [ ]* 10.5 Write unit tests for VitalSignsPanelComponent
    - Test displays most recent values correctly
    - Test IMC computed and displayed
    - Test form submission triggers POST
    - Test validation error shown for invalid input
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6_

- [x] 11. TraitementTabComponent
  - [x] 11.1 Create TraitementTabComponent
    - Create `frontend/src/app/features/services/dossier/tabs/traitement-tab.component.ts` as standalone component
    - Accept `treatments` input signal (array of TreatmentEntry)
    - Implement `sortTreatmentsDesc(entries: TreatmentEntry[]): TreatmentEntry[]` pure function for reverse-chronological ordering
    - Display each entry with date, medication name, dosage, and prescribing doctor
    - Display empty-state message when no treatments exist
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 11.2 Write property test for treatment ordering
    - **Property 5: Treatment entries reverse-chronological ordering**
    - **Validates: Requirements 6.1**
    - Use `fast-check` to generate arrays of TreatmentEntry with random dates and verify `sortTreatmentsDesc` produces descending date order

  - [ ]* 11.3 Write property test for treatment entry rendering completeness
    - **Property 6: Treatment entry rendering completeness**
    - **Validates: Requirements 6.2**
    - Use `fast-check` to generate valid TreatmentEntry objects and verify rendered output contains date, medication name, dosage, and doctor name

- [x] 12. ParcoursTabComponent
  - [x] 12.1 Create ParcoursTabComponent
    - Create `frontend/src/app/features/services/dossier/tabs/parcours-tab.component.ts` as standalone component
    - Accept `movements` input signal (array of PatientMovement)
    - Implement `sortMovementsAsc(movements: PatientMovement[]): PatientMovement[]` pure function for chronological ordering
    - Display each entry with service name, room name, bed number, movement date, and responsible doctor
    - Display empty-state message when no movements exist
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 12.2 Write property test for movement ordering
    - **Property 8: Movement entries chronological ordering**
    - **Validates: Requirements 7.3**
    - Use `fast-check` to generate arrays of PatientMovement with random `moved_at` dates and verify `sortMovementsAsc` produces ascending date order

  - [ ]* 12.3 Write property test for movement entry rendering completeness
    - **Property 7: Movement entry rendering completeness**
    - **Validates: Requirements 7.2**
    - Use `fast-check` to generate valid PatientMovement objects and verify rendered output contains service name, room name, bed number, movement date, and doctor name

- [x] 13. ObsParamedicalTabComponent
  - [x] 13.1 Create ObsParamedicalTabComponent
    - Create `frontend/src/app/features/services/dossier/tabs/obs-paramedical-tab.component.ts` as standalone component
    - Accept `observations` input signal (array of ParamedicalObservation)
    - Display each note with author name, date, and observation text
    - Conditionally show input area for adding new observations when user has nursing role
    - Conditionally show tab only when data exists or user has nursing role
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 13.2 Write property test for paramedical note rendering completeness
    - **Property 9: Paramedical note rendering completeness**
    - **Validates: Requirements 8.2**
    - Use `fast-check` to generate valid ParamedicalObservation objects and verify rendered output contains author name, date, and observation text

- [x] 14. Checkpoint - All tabs complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Integration and wiring
  - [x] 15.1 Wire all child components into DossierPageComponent
    - Import and declare TopBannerComponent, LeftSidebarComponent, MainTabbedAreaComponent, ActionsDropdownComponent in DossierPageComponent
    - Pass loaded data signals to each child component
    - Wire ActionsDropdownComponent action events to navigation/dialog handlers
    - Wire LeftSidebarComponent motif edit to admission PATCH service call
    - Ensure error states per section render independently (one section failure doesn't block others)
    - _Requirements: 10.2, 10.3, 10.4, 1.2, 9.3_

  - [x] 15.2 Wire tab components into MainTabbedAreaComponent
    - Import ResumeTabComponent, TraitementTabComponent, ParcoursTabComponent, ObsParamedicalTabComponent
    - Pass relevant data signals from DossierPageComponent through to each tab
    - Wire VitalSignsPanelComponent into ResumeTabComponent right column
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 15.3 Write integration tests for DossierPageComponent
    - Test full page renders with mocked HTTP responses
    - Test vital sign submission persists and reflects in UI
    - Test motif editing persists via PATCH
    - Test parallel data loading completes without race conditions
    - Test error in one section doesn't block other sections
    - _Requirements: 10.1, 10.2, 10.3, 5.4, 5.5, 11.3, 11.4_

- [x] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using `fast-check`
- Unit tests validate specific examples and edge cases
- The backend tasks (1.x) can be developed in parallel with the shared InlineEditComponent (3.x)
- All property-based test functions target pure utility functions extracted from components for testability

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "3.1"] },
    { "id": 1, "tasks": ["1.3", "1.4", "3.2"] },
    { "id": 2, "tasks": ["1.5", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "6.1", "7.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "6.4", "9.1"] },
    { "id": 6, "tasks": ["9.2", "10.1", "11.1", "12.1", "13.1"] },
    { "id": 7, "tasks": ["10.2", "10.3", "10.4", "10.5", "11.2", "11.3", "12.2", "12.3", "13.2"] },
    { "id": 8, "tasks": ["15.1", "15.2"] },
    { "id": 9, "tasks": ["15.3"] }
  ]
}
```
