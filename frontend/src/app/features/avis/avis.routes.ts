import { Routes } from '@angular/router';

export const AVIS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./avis-list/avis-list.component').then(m => m.AvisListComponent) },
  { path: 'nouveau', loadComponent: () => import('./avis-form/avis-form.component').then(m => m.AvisFormComponent) },
  { path: ':id', loadComponent: () => import('./avis-detail/avis-detail.component').then(m => m.AvisDetailComponent) },
];
