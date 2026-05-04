import { Routes } from '@angular/router';

export const MIGRATION_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./migration-dashboard/migration-dashboard.component').then(m => m.MigrationDashboardComponent) },
  { path: 'demarrer', loadComponent: () => import('./migration-start/migration-start.component').then(m => m.MigrationStartComponent) },
];
