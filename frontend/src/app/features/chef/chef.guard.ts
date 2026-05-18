import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

export const chefServiceGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser();

  if (!user) return router.parseUrl('/login');

  const userRole = auth.getUserRole();
  if (userRole === 'ChefService') return true;

  // Admin can also access chef routes for oversight
  if (userRole === 'Admin') return true;

  return router.parseUrl('/admin/dashboard');
};
