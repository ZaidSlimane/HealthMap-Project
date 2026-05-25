import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const PHARMACY_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/pharmacy-dashboard.component').then(m => m.PharmacyDashboardComponent),
    canActivate: [roleGuard(['Pharmacien', 'Admin'])],
    title: 'Pharmacie — Tableau de bord',
  },
  {
    path: 'catalogue',
    loadComponent: () => import('./catalogue/pharmacy-catalog.component').then(m => m.PharmacyCatalogComponent),
    canActivate: [roleGuard(['Pharmacien', 'Admin'])],
    title: 'Pharmacie — Catalogue',
  },
  {
    path: 'approvisionnement',
    loadComponent: () => import('./inbound/pharmacy-inbound.component').then(m => m.PharmacyInboundComponent),
    canActivate: [roleGuard(['Pharmacien', 'Admin'])],
    title: 'Pharmacie — Approvisionnement',
  },
  {
    path: 'distribution',
    loadComponent: () => import('./outbound/pharmacy-outbound.component').then(m => m.PharmacyOutboundComponent),
    canActivate: [roleGuard(['Pharmacien', 'Admin'])],
    title: 'Pharmacie — Distribution',
  },
  {
    path: 'inventaire',
    loadComponent: () => import('./inventory/pharmacy-inventory.component').then(m => m.PharmacyInventoryComponent),
    canActivate: [roleGuard(['Pharmacien', 'Admin'])],
    title: 'Pharmacie — Inventaire',
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
