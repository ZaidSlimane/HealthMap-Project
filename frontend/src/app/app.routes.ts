import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { onboardingGuard } from './core/auth/onboarding.guard';
import { roleGuard } from './core/auth/role.guard';
import { ShellComponent } from './shell/shell.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./features/onboarding/onboarding.component').then(m => m.OnboardingComponent),
    canActivate: [authGuard],
    title: 'Configuration du compte — HealthMap'
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [onboardingGuard],
    children: [
      { path: 'admin/dashboard', loadComponent: () => import('./features/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'admin/configuration', loadComponent: () => import('./features/admin/configuration/configuration.component').then(m => m.ConfigurationComponent), canActivate: [roleGuard(['Admin'])], title: 'Configuration — HealthMap' },
      { path: 'admin/alertes', loadComponent: () => import('./features/admin/alertes.component').then(m => m.AlertesComponent) },
      { path: 'admin/lits', redirectTo: 'admin/services', pathMatch: 'full' },
      { path: 'admin/stats', loadComponent: () => import('./features/admin/stats.component').then(m => m.StatsComponent) },
      { path: 'admin/medecins', loadComponent: () => import('./features/admin/medecins.component').then(m => m.MedecinsComponent) },
      { path: 'admin/medecin-tri', loadComponent: () => import('./features/admin/medecins.component').then(m => m.MedecinsComponent) },
      { path: 'admin/borne/medecins', loadComponent: () => import('./features/admin/medecins.component').then(m => m.MedecinsComponent) },
      { path: 'bde/dashboard', loadComponent: () => import('./features/bde/bde-dashboard.component').then(m => m.BdeDashboardComponent), canActivate: [roleGuard(['superadmin','bde'])], title: 'Tableau de bord BDE — HealthMap' },
      { path: 'bde/patient/nouveau', loadComponent: () => import('./features/bde/patient-form/patient-form.component').then(m => m.PatientFormComponent), canActivate: [roleGuard(['superadmin','bde'])], title: 'Nouveau patient — HealthMap' },
      { path: 'bde/dossier/:patientId', loadComponent: () => import('./features/bde/dossier/dossier-medical.component').then(m => m.DossierMedicalComponent), canActivate: [roleGuard(['superadmin','bde'])], title: 'Dossier médical — HealthMap' },
      { path: 'bde/patients', loadComponent: () => import('./features/bde/lists/patients-list.component').then(m => m.PatientsListComponent), canActivate: [roleGuard(['superadmin','bde'])], data: { mode: 'all' }, title: 'Liste des patients — HealthMap' },
      { path: 'bde/admis', loadComponent: () => import('./features/bde/lists/patients-list.component').then(m => m.PatientsListComponent), canActivate: [roleGuard(['superadmin','bde'])], data: { mode: 'admis' }, title: 'Malades admis — HealthMap' },
      { path: 'bde/sorties/:etat', loadComponent: () => import('./features/bde/lists/patients-list.component').then(m => m.PatientsListComponent), canActivate: [roleGuard(['superadmin','bde'])], data: { mode: 'sortie' }, title: 'État de sortie — HealthMap' },
      { path: 'bde/listes/:slug', loadComponent: () => import('./features/bde/lists/sortie-stub.component').then(m => m.SortieStubComponent), canActivate: [roleGuard(['superadmin','bde'])], title: 'État de sortie — HealthMap' },
      { path: 'bde/admissions', loadComponent: () => import('./features/admissions/admission-requests-list.component').then(m => m.AdmissionRequestsListComponent), canActivate: [roleGuard(['superadmin','admin','bde'])], title: 'Demandes d\'admission — HealthMap' },
      { path: 'radiology/dashboard', loadComponent: () => import('./features/radiology/radiology-dashboard.component').then(m => m.RadiologyDashboardComponent) },
      { path: 'radiology/requests', loadComponent: () => import('./features/radiology/radiology-requests.component').then(m => m.RadiologyRequestsComponent) },
      { path: 'radiology/requests/liste', loadComponent: () => import('./features/radiology/radiology-list.component').then(m => m.RadiologyListComponent) },
      { path: 'labo/results', loadComponent: () => import('./features/laboratory/labo-results.component').then(m => m.LaboResultsComponent) },
      { path: 'labo/reception', loadComponent: () => import('./features/laboratory/labo-results.component').then(m => m.LaboResultsComponent) },
      // Lab & Radiology module routes (worklist + detail)
      { path: 'radiology', loadChildren: () => import('./features/radiology/radiology.routes').then(m => m.RADIOLOGY_ROUTES), canActivate: [roleGuard(['RadioTech', 'Admin'])] },
      { path: 'laboratory', loadChildren: () => import('./features/laboratory/laboratory.routes').then(m => m.LABORATORY_ROUTES), canActivate: [roleGuard(['LabTech', 'Admin'])] },
      { path: 'consultation', loadComponent: () => import('./features/consultation/consultation-select.component').then(m => m.ConsultationSelectComponent) },
      { path: 'consultation/active', loadComponent: () => import('./features/consultation/consultation.component').then(m => m.ConsultationComponent) },
      { path: 'consultation/tri', loadComponent: () => import('./features/consultation/triage.component').then(m => m.TriageComponent) },
      { path: 'queue/call', loadComponent: () => import('./features/queue/queue-call.component').then(m => m.QueueCallComponent) },
      { path: 'appointments', loadComponent: () => import('./features/appointments/appointments.component').then(m => m.AppointmentsComponent) },
      { path: 'services/:serviceId', loadComponent: () => import('./features/services/service.component').then(m => m.ServiceComponent) },
      { path: 'services/:serviceId/admission/:admissionId', loadComponent: () => import('./features/services/dossier/dossier-page.component').then(m => m.DossierPageComponent), canActivate: [roleGuard(['Doctor', 'Admin'])], title: 'Dossier Patient — HealthMap' },
      { path: 'chimio/protocoles', loadComponent: () => import('./features/admin/stats.component').then(m => m.StatsComponent) },
      { path: 'chimio/sessions', loadComponent: () => import('./features/admin/stats.component').then(m => m.StatsComponent) },
      // Chef de Service routes
      { path: 'chef', loadChildren: () => import('./features/chef/chef.routes').then(m => m.CHEF_ROUTES), canActivate: [authGuard] },
      // Phase 2 routes
      { path: 'consultations', loadChildren: () => import('./features/consultations/consultations.routes').then(m => m.CONSULTATIONS_ROUTES), canActivate: [authGuard] },
      { path: 'ordonnances', loadChildren: () => import('./features/ordonnances/ordonnances.routes').then(m => m.ORDONNANCES_ROUTES), canActivate: [roleGuard(['ADMIN','MEDECIN'])] },
      { path: 'symptomes', loadChildren: () => import('./features/symptomes/symptomes.routes').then(m => m.SYMPTOMES_ROUTES), canActivate: [authGuard] },
      { path: 'diagnostics', loadChildren: () => import('./features/diagnostics/diagnostics.routes').then(m => m.DIAGNOSTICS_ROUTES), canActivate: [roleGuard(['ADMIN','MEDECIN'])] },
      { path: 'avis-externes', loadChildren: () => import('./features/avis/avis.routes').then(m => m.AVIS_ROUTES), canActivate: [roleGuard(['ADMIN','MEDECIN'])] },
      { path: 'rapports', loadChildren: () => import('./features/rapports/rapports.routes').then(m => m.RAPPORTS_ROUTES), canActivate: [roleGuard(['ADMIN','MEDECIN'])] },
      { path: 'profil', loadComponent: () => import('./features/profil/profil.component').then(m => m.ProfilComponent), canActivate: [authGuard] },
      { path: 'compte', loadComponent: () => import('./features/compte/compte.component').then(m => m.CompteComponent), canActivate: [authGuard] },
      { path: 'recherche', loadComponent: () => import('./features/recherche/recherche.component').then(m => m.RechercheComponent), canActivate: [authGuard] },
      { path: 'reseau', loadComponent: () => import('./features/reseau/reseau.component').then(m => m.ReseauComponent), canActivate: [roleGuard(['ADMIN'])] },
      { path: 'import', loadComponent: () => import('./features/import/import.component').then(m => m.ImportComponent), canActivate: [roleGuard(['ADMIN'])] },
      { path: 'migration', loadChildren: () => import('./features/migration/migration.routes').then(m => m.MIGRATION_ROUTES), canActivate: [roleGuard(['ADMIN'])] },
      { path: 'carte', loadComponent: () => import('./features/carte/campus-map.component').then(m => m.CampusMapComponent), canActivate: [authGuard] },
      { path: 'carte/service/:serviceId', loadComponent: () => import('./features/carte/service-map.component').then(m => m.ServiceMapComponent), canActivate: [authGuard] },
      { path: 'admin/services', loadChildren: () => import('./features/services-config/services.routes').then(m => m.SERVICES_ROUTES), canActivate: [roleGuard(['superadmin','admin'])], title: 'Gestion des Services — HealthMap' },
      { path: 'admin/map-config', loadComponent: () => import('./features/geospatial-service/map-config.component').then(m => m.MapConfigComponent), canActivate: [roleGuard(['Admin'])], title: 'Configuration Carte — HealthMap' },
      // Sidebar restructure stubs — new ADMIN sections (Personnel, Utilisateurs,
      // unit-scoped config). Real pages land here later; for now the sidebar
      // entries route to a labelled "à venir" placeholder so clicks don't
      // bounce to /login via the wildcard.
      // Personnel & Utilisateurs is a single 3-tab page; /admin/utilisateurs
      // deep-links to the Utilisateurs tab via ?tab=1.
      { path: 'admin/personnel', loadComponent: () => import('./features/admin/personnel/personnel.component').then(m => m.PersonnelComponent), canActivate: [roleGuard(['superadmin'])], title: 'Gestion du Personnel — HealthMap' },
      // Same component, defaults to the Utilisateurs tab via route data.
      { path: 'admin/utilisateurs', loadComponent: () => import('./features/admin/personnel/personnel.component').then(m => m.PersonnelComponent), canActivate: [roleGuard(['superadmin'])], data: { defaultTab: 1 }, title: 'Utilisateurs — HealthMap' },
      { path: 'admin/borne/box', loadComponent: () => import('./features/_placeholder/coming-soon.component').then(m => m.ComingSoonComponent), canActivate: [roleGuard(['superadmin','admin'])], data: { title: 'Box (paramétrages borne)' }, title: 'Box — HealthMap' },
      { path: 'admin/borne/config', loadComponent: () => import('./features/_placeholder/coming-soon.component').then(m => m.ComingSoonComponent), canActivate: [roleGuard(['superadmin','admin'])], data: { title: 'Borne (paramétrages)' }, title: 'Borne — HealthMap' },
      { path: 'admin/radiologie/config', loadComponent: () => import('./features/_placeholder/coming-soon.component').then(m => m.ComingSoonComponent), canActivate: [roleGuard(['superadmin','admin'])], data: { title: 'Radiologie — Configuration' }, title: 'Radiologie Config — HealthMap' },
      { path: 'admin/laboratoire/config', loadComponent: () => import('./features/_placeholder/coming-soon.component').then(m => m.ComingSoonComponent), canActivate: [roleGuard(['superadmin','admin'])], data: { title: 'Laboratoire — Configuration' }, title: 'Laboratoire Config — HealthMap' },
    ]
  },
  // Kiosk routes — no auth, no shell
  { path: 'borne', loadChildren: () => import('./features/borne/borne.routes').then(m => m.BORNE_ROUTES) },
  { path: 'affichage', loadComponent: () => import('./features/borne/affichage/affichage.component').then(m => m.AffichageComponent) },
  { path: 'tv', loadComponent: () => import('./features/queue/tv-display.component').then(m => m.TvDisplayComponent) },
  { path: '**', redirectTo: 'login' }
];
