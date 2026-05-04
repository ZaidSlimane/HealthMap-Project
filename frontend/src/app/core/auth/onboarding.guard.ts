import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { OnboardingService } from '../services/onboarding.service';

export const onboardingGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const onboarding = inject(OnboardingService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.parseUrl('/login');
  }

  if (onboarding.needsOnboarding()) {
    return router.parseUrl('/onboarding');
  }

  return true;
};
