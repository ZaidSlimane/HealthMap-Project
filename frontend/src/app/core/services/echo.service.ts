import { Injectable, inject, OnDestroy } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';

/**
 * Wraps Laravel Echo over Reverb (Pusher-protocol WebSocket).
 *
 * Push path:  Laravel → Redis queue → Reverb WS → Echo → signals
 * Fallback:   NotificationService polls /notifications/counts every 8s
 *
 * Both coexist:
 *   - When sockets are healthy  → Echo gives instant updates
 *   - When sockets break        → polling keeps UI in sync (≤8s delay)
 *
 * Call startEcho() once (from AppComponent or Shell) after login.
 * Call stopEcho() on logout.
 */
@Injectable({ providedIn: 'root' })
export class EchoService implements OnDestroy {
  private echo: Echo<any> | null = null;
  private readonly notifs = inject(NotificationService);

  startEcho(): void {
    if (this.echo) return; // already connected

    // Make Pusher available globally — Echo requires window.Pusher
    (window as any).Pusher = Pusher;

    this.echo = new Echo({
      broadcaster: 'reverb',
      key: environment.reverb.appKey,
      wsHost: environment.reverb.wsHost,
      wsPort: environment.reverb.wsPort,
      wssPort: environment.reverb.wsPort,
      forceTLS: false,
      enabledTransports: ['ws'],
      disableStats: true,
    });

    this.subscribeToChannels();
  }

  stopEcho(): void {
    if (this.echo) {
      this.echo.disconnect();
      this.echo = null;
    }
  }

  ngOnDestroy(): void {
    this.stopEcho();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Channel subscriptions
  // ─────────────────────────────────────────────────────────────────────────

  private subscribeToChannels(): void {
    if (!this.echo) return;

    // ── New exam requested (doctor → lab or radio) ──────────────────────────
    // Both channels use the same ExamRequested event shape: { module, payload }
    this.echo.channel('laboratory.requests').listen('ExamRequested', () => {
      // Force an immediate poll refresh — don't wait 8s
      this.notifs.forceRefresh();
    });

    this.echo.channel('radiology.requests').listen('ExamRequested', () => {
      this.notifs.forceRefresh();
    });

    // ── Request cancelled ────────────────────────────────────────────────────
    this.echo.channel('laboratory.requests').listen('RequestCancelled', () => {
      this.notifs.forceRefresh();
    });

    this.echo.channel('radiology.requests').listen('RequestCancelled', () => {
      this.notifs.forceRefresh();
    });

    // ── Result ready (lab/radio → doctor) ───────────────────────────────────
    this.echo.channel('laboratory.results').listen('ResultReady', () => {
      this.notifs.forceRefresh();
    });

    this.echo.channel('radiology.results').listen('ResultReady', () => {
      this.notifs.forceRefresh();
    });
  }
}
