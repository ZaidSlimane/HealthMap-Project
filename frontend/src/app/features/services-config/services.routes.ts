import { Routes } from '@angular/router';

export const SERVICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./shell/services-shell.component').then(m => m.ServicesShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard-page/dashboard-page.component').then(m => m.DashboardPageComponent),
        title: 'Gestion des Services — HealthMap',
        data: { breadcrumb: 'Tableau de bord' }
      },
      {
        path: 'establishment',
        loadComponent: () => import('./pages/establishment-page/establishment-page.component').then(m => m.EstablishmentPageComponent),
        title: 'Établissement — HealthMap',
        data: { breadcrumb: 'Établissement' }
      },
      {
        path: 'types',
        loadComponent: () => import('./pages/establishment-services-page/establishment-services-page.component').then(m => m.EstablishmentServicesPageComponent),
        title: 'Services de l\'établissement — HealthMap',
        data: { breadcrumb: 'Services de l\'établissement' }
      },
      {
        path: ':serviceId/lits',
        loadComponent: () => import('./components/bed-management-page/bed-management-page.component').then(m => m.BedManagementPageComponent),
        title: 'Gestion des Lits — HealthMap',
        data: { breadcrumb: 'Gestion des lits' }
      },
    ]
  }
];
