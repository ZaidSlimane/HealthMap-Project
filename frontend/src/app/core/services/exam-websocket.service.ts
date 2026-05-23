import { Injectable } from '@angular/core';
import { Observable, EMPTY } from 'rxjs';

// TODO: Wire to Laravel Echo / Reverb when WebSocket infrastructure is configured

@Injectable({ providedIn: 'root' })
export class ExamWebSocketService {

  /**
   * Emits when a new exam request is created for the given module.
   * Placeholder — returns EMPTY until Laravel Reverb is configured.
   */
  onExamRequested(module: 'radiology' | 'laboratory'): Observable<any> {
    return EMPTY;
  }

  /**
   * Emits when a result is ready for the given module.
   * Placeholder — returns EMPTY until Laravel Reverb is configured.
   */
  onResultReady(module: 'radiology' | 'laboratory'): Observable<any> {
    return EMPTY;
  }

  /**
   * Emits when a request is cancelled for the given module.
   * Placeholder — returns EMPTY until Laravel Reverb is configured.
   */
  onRequestCancelled(module: 'radiology' | 'laboratory'): Observable<any> {
    return EMPTY;
  }
}
