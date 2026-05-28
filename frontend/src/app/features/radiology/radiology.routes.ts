import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const RADIOLOGY_ROUTES: Routes = [
  // /radiology → redirect to the requests+calendar screen
  {
    path: '',
    redirectTo: '/radiology/requests',
    pathMatch: 'full',
  },
  // /radiology/requests/:id → individual request detail
  {
    path: 'requests/:id',
    loadComponent: () => import('./detail/radio-request-detail.component').then(m => m.RadioRequestDetailComponent),
    canActivate: [roleGuard(['RadioTech', 'Admin'])],
  },
  // /radiology/rdv → scheduling calendar
  {
    path: 'rdv',
    loadComponent: () => import('./rdv/rdv-page.component').then(m => m.RdvPageComponent),
    canActivate: [roleGuard(['RadioTech', 'Admin'])],
  },
];
