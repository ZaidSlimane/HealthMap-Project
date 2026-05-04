import { Routes } from '@angular/router';

export const ORDONNANCES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./ordonnance-list/ordonnance-list.component').then(m => m.OrdonnanceListComponent) },
  { path: 'nouvelle/:patientId', loadComponent: () => import('./ordonnance-form/ordonnance-form.component').then(m => m.OrdonnanceFormComponent) },
  { path: ':id', loadComponent: () => import('./ordonnance-detail/ordonnance-detail.component').then(m => m.OrdonnanceDetailComponent) },
  { path: ':id/imprimer', loadComponent: () => import('./ordonnance-print/ordonnance-print.component').then(m => m.OrdonnancePrintComponent) },
];
