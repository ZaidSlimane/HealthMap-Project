# Requirements Document

## Introduction

The Patient Dossier is the comprehensive medical record view for an admitted patient within the HealthMap application. It is accessed by clicking an occupied bed card on the service page and displays all clinical, administrative, and nursing data for the current admission. The page replaces the existing skeleton `admission-resume.component.ts` with a full-featured dossier layout consisting of a top banner, a left sidebar, and a main tabbed content area. The doctor application sidebar remains unchanged; all dossier content renders in the main body area.

## Glossary

- **Dossier_Page**: The Angular standalone component rendered at route `/services/:serviceId/admission/:admissionId` that displays the full patient medical record
- **Top_Banner**: A horizontal strip of four colored cards showing patient identity, admission info, service/bed info, and a navigation button
- **Left_Sidebar**: A vertical panel inside the page body (not the application shell sidebar) displaying patient metadata, actions, and quick-access sections
- **Main_Tabbed_Area**: The primary content zone with four tabs: Résumé, Fiche de Traitement, Parcours, Observation Paramedical
- **Vital_Signs_Panel**: A sub-section within the Résumé tab that displays live vital sign values and provides input fields for recording new measurements
- **Actions_Dropdown**: A dropdown menu in the top-right corner of the page providing clinical action shortcuts (only visible for active admissions)
- **Admission**: A database record representing a patient's stay in a service, with status (pending, active, discharged, cancelled)
- **Patient**: A database record containing demographic and identity information
- **Companion**: A garde malade (caregiver companion) record linked to an admission
- **Observation**: A medical observation note recorded by a doctor for a patient
- **Patient_Movement**: A record tracking bed/service transfers during an admission
- **IMC**: Indice de Masse Corporelle (Body Mass Index), computed from height and weight vital signs

## Requirements

### Requirement 1: Page Navigation and Routing

**User Story:** As a doctor, I want to navigate to a patient's dossier by clicking an occupied bed card, so that I can view the full medical record without leaving my service context.

#### Acceptance Criteria

1. WHEN a user clicks an occupied bed card on the service page, THE Dossier_Page SHALL navigate to `/services/:serviceId/admission/:admissionId` with the corresponding admission identifier
2. WHEN the Dossier_Page route is activated, THE Dossier_Page SHALL load the admission data including patient, service, bed, and room relationships
3. WHEN the user clicks the "Revenir au service" button, THE Dossier_Page SHALL navigate back to `/services/:serviceId`
4. THE Dossier_Page SHALL be accessible to users with the Doctor role or the Admin role
5. IF the admission identifier does not correspond to a valid admission, THEN THE Dossier_Page SHALL display an error message and provide a link to return to the service page

### Requirement 2: Top Banner Display

**User Story:** As a doctor, I want to see key patient and admission information at a glance in a colored banner, so that I can quickly confirm I am viewing the correct patient record.

#### Acceptance Criteria

1. THE Top_Banner SHALL display a green card containing the patient full name, date of birth, and computed age
2. THE Top_Banner SHALL display an orange card containing the admission number and admission date
3. THE Top_Banner SHALL display a blue card containing the service name and bed number
4. THE Top_Banner SHALL display a "Revenir au service" navigation button
5. THE Top_Banner SHALL remain visible regardless of which tab is selected in the Main_Tabbed_Area

### Requirement 3: Left Sidebar Content

**User Story:** As a doctor, I want a sidebar with patient metadata and quick-access sections, so that I can see essential context while working in any tab.

#### Acceptance Criteria

1. THE Left_Sidebar SHALL display a patient photo placeholder area
2. WHEN the patient has a blood group recorded, THE Left_Sidebar SHALL display the blood group value
3. THE Left_Sidebar SHALL display the emergency contact information from the Companion record linked to the admission
4. THE Left_Sidebar SHALL display the treating doctor name for the current admission
5. THE Left_Sidebar SHALL display the motif d'admission as an editable text field
6. WHEN the user modifies the motif d'admission and confirms, THE Left_Sidebar SHALL send a PATCH request to update the admission record
7. THE Left_Sidebar SHALL display a list of Companion entries (garde malade) associated with the admission
8. THE Left_Sidebar SHALL display a "Crypter/Décrypter dossier" action button
9. THE Left_Sidebar SHALL display a "Partager dossier" action button
10. THE Left_Sidebar SHALL display an "Examen/Bilan demandé" section listing radio_demande and labo_demande records with their current status
11. THE Left_Sidebar SHALL display a "Historique des admissions" section listing all previous admissions for the same patient
12. THE Left_Sidebar SHALL display a "Centre d'impression" section with print links for relevant documents

### Requirement 4: Résumé Tab Layout

**User Story:** As a doctor, I want the Résumé tab to present a three-column overview of all clinical data, so that I can assess the patient's current state in one view.

#### Acceptance Criteria

1. WHEN the Résumé tab is active, THE Main_Tabbed_Area SHALL display three sub-columns: left, center, and right
2. THE Résumé tab left column SHALL display sections for Feuilles de flux, Diagnostic, Bilan psychologique, Antécédents médicaux, and Fichiers
3. THE Résumé tab center column SHALL display sections for Observations médicales, Allergies, and Médicaments
4. THE Résumé tab right column SHALL display sections for Vital_Signs_Panel, Acte chirurgical, and Rendez-vous
5. WHEN the admission has no data for a given section, THE Main_Tabbed_Area SHALL display an empty-state message indicating no records exist

### Requirement 5: Vital Signs Display and Entry

**User Story:** As a doctor, I want to view current vital signs and record new measurements directly from the dossier, so that I can monitor and update the patient's condition without navigating away.

#### Acceptance Criteria

1. THE Vital_Signs_Panel SHALL display the most recent recorded values for temperature, height, weight, pulse, blood pressure, and glycemia
2. THE Vital_Signs_Panel SHALL compute and display the IMC value from the most recent height and weight measurements
3. THE Vital_Signs_Panel SHALL provide input fields for entering new values for each vital sign type
4. WHEN the user submits a new vital sign measurement, THE Vital_Signs_Panel SHALL send a POST request to the vital_signs endpoint with the admission identifier, patient identifier, vital sign type, value, and current timestamp
5. WHEN the POST request succeeds, THE Vital_Signs_Panel SHALL update the displayed value to reflect the new measurement without requiring a full page reload
6. IF the user submits an invalid vital sign value (non-numeric or out of physiological range), THEN THE Vital_Signs_Panel SHALL display a validation error and prevent submission

### Requirement 6: Fiche de Traitement Tab

**User Story:** As a doctor, I want to view the treatment chronology in reverse order, so that I can quickly see the most recent treatments administered to the patient.

#### Acceptance Criteria

1. WHEN the Fiche de Traitement tab is active, THE Main_Tabbed_Area SHALL display a reverse-chronological timeline of treatment entries
2. THE Fiche de Traitement tab SHALL display each treatment entry with the date, medication name, dosage, and administering user
3. WHEN no treatment entries exist for the admission, THE Main_Tabbed_Area SHALL display an empty-state message

### Requirement 7: Parcours Tab

**User Story:** As a doctor, I want to view the patient's movement history, so that I can understand which services and beds the patient has occupied during the admission.

#### Acceptance Criteria

1. WHEN the Parcours tab is active, THE Main_Tabbed_Area SHALL display a list of Patient_Movement records for the current admission
2. THE Parcours tab SHALL display each movement entry with the service name, room name, bed number, movement date, and responsible doctor
3. THE Parcours tab SHALL order movement entries chronologically from earliest to most recent
4. WHEN no movement records exist, THE Main_Tabbed_Area SHALL display an empty-state message

### Requirement 8: Observation Paramedical Tab

**User Story:** As a nurse, I want a dedicated tab for paramedical observations, so that I can record and review nursing notes separately from medical observations.

#### Acceptance Criteria

1. WHEN the Observation Paramedical tab is active, THE Main_Tabbed_Area SHALL display a feed of paramedical observation notes for the current admission
2. THE Observation Paramedical tab SHALL display each note with the author name, date, and observation text
3. WHEN the user has a nursing role, THE Observation Paramedical tab SHALL provide an input area for adding new paramedical observations
4. THE Observation Paramedical tab SHALL only be visible when the admission has paramedical observation data or the current user has a nursing role

### Requirement 9: Actions Dropdown

**User Story:** As a doctor, I want quick access to clinical actions from the dossier page, so that I can initiate orders and requests without navigating to separate pages.

#### Acceptance Criteria

1. WHILE the admission status is "active", THE Actions_Dropdown SHALL be visible in the top-right area of the Dossier_Page
2. THE Actions_Dropdown SHALL contain menu items for: Demander un examen radiologique, Demander un bilan biologique, Demander un acte, Prescrire un médicament, Transfert inter-service, Gestion des gardes malade, Gestion Fichier, Demander un avis spécialisé, and Sortie médicale
3. WHEN the user selects a menu item from the Actions_Dropdown, THE Dossier_Page SHALL open the corresponding action dialog or navigate to the appropriate form
4. WHILE the admission status is "discharged" or "cancelled", THE Actions_Dropdown SHALL NOT be visible

### Requirement 10: Data Loading and Performance

**User Story:** As a doctor, I want the dossier page to load efficiently, so that I can access patient information without excessive waiting.

#### Acceptance Criteria

1. WHEN the Dossier_Page is initialized, THE Dossier_Page SHALL display a loading indicator until the primary admission data is retrieved
2. THE Dossier_Page SHALL load secondary data (vital signs, observations, movements, exam requests) in parallel after the primary admission data is available
3. IF a data loading request fails, THEN THE Dossier_Page SHALL display an error indicator in the affected section without blocking other sections from rendering
4. THE Dossier_Page SHALL preserve the application shell sidebar (Consultation, MES SERVICES, Mon profil) without modification

### Requirement 11: Motif d'Admission Editing

**User Story:** As a doctor, I want to edit the admission reason directly from the dossier sidebar, so that I can correct or update it as the clinical picture evolves.

#### Acceptance Criteria

1. THE Left_Sidebar SHALL display the motif d'admission in an inline-editable text field
2. WHEN the user clicks the motif d'admission field, THE Left_Sidebar SHALL switch the field to edit mode with a text input
3. WHEN the user confirms the edit (blur or Enter key), THE Left_Sidebar SHALL send a PATCH request to update the admission motif_admission field
4. IF the PATCH request fails, THEN THE Left_Sidebar SHALL revert the displayed value to the previous content and display an error notification
5. WHILE the PATCH request is in progress, THE Left_Sidebar SHALL disable the motif field to prevent concurrent edits

### Requirement 12: Exam and Lab Request Status Display

**User Story:** As a doctor, I want to see the status of radiology and laboratory requests from the sidebar, so that I can track pending results without navigating to separate modules.

#### Acceptance Criteria

1. THE Left_Sidebar SHALL display radio_demande records for the current admission with their status (pending, in_progress, completed, cancelled)
2. THE Left_Sidebar SHALL display labo_demande records for the current admission with their status
3. WHEN a request status is "pending" or "in_progress", THE Left_Sidebar SHALL display the request with a visual indicator distinguishing it from completed requests
4. WHEN a request status is "completed", THE Left_Sidebar SHALL provide a link or action to view the result

### Requirement 13: Admission History

**User Story:** As a doctor, I want to see all previous admissions for the same patient, so that I can understand the patient's hospitalization history.

#### Acceptance Criteria

1. THE Left_Sidebar SHALL display a list of all admissions for the current patient ordered by date descending
2. THE Left_Sidebar SHALL highlight the current admission in the history list
3. WHEN the user clicks a previous admission entry, THE Left_Sidebar SHALL navigate to the dossier page for that admission
