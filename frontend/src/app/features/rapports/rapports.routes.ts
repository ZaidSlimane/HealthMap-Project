import { Routes } from '@angular/router';

export const RAPPORTS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./rapports-dashboard/rapports-dashboard.component').then(m => m.RapportsDashboardComponent) },
  { path: 'medical', loadComponent: () => import('./rapport-medical/rapport-medical.component').then(m => m.RapportMedicalComponent) },
  { path: 'bde', loadComponent: () => import('./rapport-bde/rapport-bde.component').then(m => m.RapportBDEComponent) },
];
