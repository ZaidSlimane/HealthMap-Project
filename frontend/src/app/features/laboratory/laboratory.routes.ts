import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const LABORATORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./worklist/labo-worklist.component').then(m => m.LaboWorklistComponent),
    canActivate: [roleGuard(['LabTech', 'Admin'])]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/labo-dashboard.component').then(m => m.LaboDashboardComponent),
    canActivate: [roleGuard(['LabTech', 'Admin'])]
  },
  {
    path: 'reception',
    loadComponent: () => import('./reception/labo-reception.component').then(m => m.LaboReceptionComponent),
    canActivate: [roleGuard(['LabTech', 'LabAssistant', 'LabHeadChief', 'Admin'])]
  },
  {
    path: 'requests/:id',
    loadComponent: () => import('./detail/labo-request-detail.component').then(m => m.LaboRequestDetailComponent),
    canActivate: [roleGuard(['LabTech', 'Admin'])]
  }
];
