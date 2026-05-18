import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

/**
 * Tracks the number of in-flight HTTP requests so the UI can show a
 * global progress indicator. Skips polling/silent requests by checking
 * for a custom header `X-Silent: true`.
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);

  // Allow individual requests to opt out (e.g. background polling)
  if (req.headers.has('X-Silent')) {
    const cleaned = req.clone({ headers: req.headers.delete('X-Silent') });
    return next(cleaned);
  }

  loading.start();
  return next(req).pipe(
    finalize(() => loading.stop())
  );
};
