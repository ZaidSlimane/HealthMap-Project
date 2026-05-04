import { Routes } from '@angular/router';

export const SYMPTOMES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./triage-list/triage-list.component').then(m => m.TriageListComponent) },
  { path: 'nouveau', loadComponent: () => import('./triage-form/triage-form.component').then(m => m.TriageFormComponent) },
  { path: ':id', loadComponent: () => import('./triage-detail/triage-detail.component').then(m => m.TriageDetailComponent) },
];
