import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly _activeCount = signal(0);

  readonly isLoading = computed(() => this._activeCount() > 0);
  readonly activeCount = this._activeCount.asReadonly();

  start(): void {
    this._activeCount.update(n => n + 1);
  }

  stop(): void {
    this._activeCount.update(n => Math.max(0, n - 1));
  }

  reset(): void {
    this._activeCount.set(0);
  }
}
