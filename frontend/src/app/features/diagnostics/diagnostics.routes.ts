import { Routes } from '@angular/router';

export const DIAGNOSTICS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./diagnostic-list/diagnostic-list.component').then(m => m.DiagnosticListComponent) },
  { path: 'codage/:consultationId', loadComponent: () => import('./codage/codage.component').then(m => m.CodageComponent) },
  { path: 'sorties', loadComponent: () => import('./sorties/sorties.component').then(m => m.SortiesComponent) },
];
