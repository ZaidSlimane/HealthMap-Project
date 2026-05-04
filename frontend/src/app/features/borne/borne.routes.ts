import { Routes } from '@angular/router';

export const BORNE_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./borne-accueil/borne-accueil.component').then(m => m.BorneAccueilComponent) },
  { path: 'inscription', loadComponent: () => import('./borne-inscription/borne-inscription.component').then(m => m.BorneInscriptionComponent) },
  { path: 'ticket', loadComponent: () => import('./borne-ticket/borne-ticket.component').then(m => m.BorneTicketComponent) },
  { path: 'historique', loadComponent: () => import('./borne-historique/borne-historique.component').then(m => m.BorneHistoriqueComponent) },
  { path: 'appel', loadComponent: () => import('./borne-appel/borne-appel.component').then(m => m.BorneAppelComponent) },
];
