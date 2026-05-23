import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

const ROLE_MAP: Record<string, string[]> = {
  'ADMIN': ['Admin', 'superadmin'],
  'MEDECIN': ['Admin', 'consultation'],
  'INFIRMIER': ['Admin', 'consultation'],
  'RECEPTIONNISTE': ['Admin', 'bde'],
};

export const roleGuard = (roles: string[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser();
  if (!user) return router.parseUrl('/login');

  const userRole = auth.getUserRole();

  // Backend Admin role is a wildcard: it grants access to every guarded route.
  if (userRole.toLowerCase() === 'admin') return true;

  // Case-insensitive comparison — DB may store 'BDE' while route uses 'bde'
  const allowed = roles.flatMap(r => ROLE_MAP[r] ?? [r]);
  const userRoleLower = userRole.toLowerCase();

  if (allowed.some(r => r.toLowerCase() === userRoleLower)) return true;
  return router.parseUrl(auth.getDefaultRoute());
};
