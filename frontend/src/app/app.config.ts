import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { AuthService } from './core/auth/auth.service';
import { catchError, of } from 'rxjs';

/**
 * On every app boot, refresh the user signal from /auth/me so that
 * stale localStorage data (old establishment, name, roles) is replaced
 * with the current server state. If the request fails (not logged in),
 * we simply leave the signal as null — no redirect needed here, guards
 * handle that.
 */
function refreshUserOnInit(auth: AuthService) {
  return () => auth.checkAuth().pipe(catchError(() => of(null)));
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([credentialsInterceptor, loadingInterceptor])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: refreshUserOnInit,
      deps: [AuthService],
      multi: true,
    },
  ]
};
