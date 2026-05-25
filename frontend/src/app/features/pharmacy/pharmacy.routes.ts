import { Routes } from '@angular/router';
import { PharmacyHubComponent } from './pharmacy-hub/pharmacy-hub.component';
import { PharmacyDashboardComponent } from './dashboard/pharmacy-dashboard.component';
import { PharmacyCatalogComponent } from './catalogue/pharmacy-catalog.component';
import { PharmacyInboundComponent } from './inbound/pharmacy-inbound.component';
import { PharmacyOutboundComponent } from './outbound/pharmacy-outbound.component';
import { PharmacyInventoryComponent } from './inventory/pharmacy-inventory.component';
import { roleGuard } from '../../core/auth/role.guard';

export const PHARMACY_ROUTES: Routes = [
  {
    path: 'pharmacie',
    component: PharmacyHubComponent,
    canActivate: [roleGuard],
    data: { roles: ['Pharmacien', 'Admin'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: PharmacyDashboardComponent },
      { path: 'catalogue', component: PharmacyCatalogComponent },
      { path: 'approvisionnement', component: PharmacyInboundComponent },
      { path: 'distribution', component: PharmacyOutboundComponent },
      { path: 'inventaire', component: PharmacyInventoryComponent },
    ],
  },
];
