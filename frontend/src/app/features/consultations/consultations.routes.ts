import { Routes } from '@angular/router';

export const CONSULTATIONS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./consultation-list/consultation-list.component').then(m => m.ConsultationListComponent) },
  { path: 'nouvelle', loadComponent: () => import('./consultation-form/consultation-form.component').then(m => m.ConsultationFormComponent) },
  { path: ':id', loadComponent: () => import('./consultation-detail/consultation-detail.component').then(m => m.ConsultationDetailComponent) },
];
