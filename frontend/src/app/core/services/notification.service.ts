import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface NotificationCounts {
  labo_pending:  number;
  radio_pending: number;
  results_ready: number;
  total:         number;
}

/**
 * Polls GET /api/clinical-core/notifications/counts every 8 seconds
 * while the user is authenticated.
 *
 * Exposed as a signal so the HeaderComponent can bind directly to
 * `notifService.counts()` without change detection concerns.
 *
 * Polling starts on the first call to startPolling() and stops on
 * stopPolling() or when the user logs out.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private readonly http   = inject(HttpClient);
  private readonly auth   = inject(AuthService);
  private readonly url    = `${environment.baseUrl}/clinical-core/notifications/counts`;

  readonly counts = signal<NotificationCounts>({
    labo_pending:  0,
    radio_pending: 0,
    results_ready: 0,
    total:         0,
  });

  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly INTERVAL_MS = 8_000;

  startPolling(): void {
    if (this.timer) return;               // already polling
    if (!this.auth.isAuthenticated()) return;

    this.fetchCounts();                   // immediate first load
    this.timer = setInterval(() => {
      if (this.auth.isAuthenticated()) {
        this.fetchCounts();
      } else {
        this.stopPolling();
      }
    }, this.INTERVAL_MS);
  }

  stopPolling(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.counts.set({ labo_pending: 0, radio_pending: 0, results_ready: 0, total: 0 });
  }

  /** Called by EchoService when a WebSocket event arrives — skips the 8s wait. */
  forceRefresh(): void {
    this.fetchCounts();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private fetchCounts(): void {
    // X-Silent tells the loading interceptor to skip this background poll
    // so the global progress bar stays idle between user-initiated actions.
    this.http.get<NotificationCounts>(this.url, {
      headers: { 'X-Silent': 'true' },
    }).subscribe({
      next: (c) => this.counts.set(c),
      error: () => { /* silently ignore — network hiccup */ },
    });
  }
}
