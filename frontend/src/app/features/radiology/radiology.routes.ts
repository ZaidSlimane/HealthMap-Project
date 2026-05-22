import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const RADIOLOGY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./worklist/radio-worklist.component').then(m => m.RadioWorklistComponent),
    canActivate: [roleGuard(['RadioTech', 'Admin'])]
  },
  {
    path: 'requests/:id',
    loadComponent: () => import('./detail/radio-request-detail.component').then(m => m.RadioRequestDetailComponent),
    canActivate: [roleGuard(['RadioTech', 'Admin'])]
  },
  {
    path: 'rdv',
    loadComponent: () => import('./rdv/rdv-page.component').then(m => m.RdvPageComponent),
    canActivate: [roleGuard(['RadioTech', 'Admin'])]
  }
];
