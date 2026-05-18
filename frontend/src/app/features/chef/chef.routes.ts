import { Routes } from '@angular/router';
import { chefServiceGuard } from './chef.guard';

export const CHEF_ROUTES: Routes = [
  {
    path: '',
    canActivate: [chefServiceGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/chef-dashboard.component')
          .then(m => m.ChefDashboardComponent),
        title: 'Tableau de bord Chef — HealthMap'
      },
      {
        path: 'boxes',
        loadComponent: () => import('./boxes/box-list.component')
          .then(m => m.BoxListComponent),
        title: 'Boxes — HealthMap'
      },
      {
        path: 'boxes/new',
        loadComponent: () => import('./boxes/box-form.component')
          .then(m => m.BoxFormComponent),
        title: 'Nouvelle Box — HealthMap'
      },
      {
        path: 'boxes/:id/edit',
        loadComponent: () => import('./boxes/box-form.component')
          .then(m => m.BoxFormComponent),
        title: 'Modifier Box — HealthMap'
      },
      {
        path: 'boxes/:id/assign',
        loadComponent: () => import('./boxes/box-assign.component')
          .then(m => m.BoxAssignComponent),
        title: 'Assigner Médecin — HealthMap'
      },
      {
        path: 'medecins',
        loadComponent: () => import('./medecins/chef-medecins.component')
          .then(m => m.ChefMedecinsComponent),
        title: 'Médecins — HealthMap'
      },
    ]
  }
];
