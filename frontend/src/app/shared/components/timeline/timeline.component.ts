import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  description?: string;
  type: 'consultation' | 'ordonnance' | 'examen' | 'hospitalisation' | 'avis' | 'urgence';
  medecin?: string;
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="timeline">
      @for (event of events(); track event.id; let last = $last) {
        <div class="timeline-item">
          <div class="ti-left">
            <div class="ti-dot" [class]="'dot-' + event.type">
              <mat-icon>{{ typeIcon(event.type) }}</mat-icon>
            </div>
            @if (!last) { <div class="ti-line"></div> }
          </div>
          <div class="ti-body">
            <div class="ti-header">
              <span class="ti-title">{{ event.title }}</span>
              <span class="ti-date">{{ event.date | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            @if (event.description) {
              <p class="ti-desc">{{ event.description }}</p>
            }
            @if (event.medecin) {
              <span class="ti-doctor"><mat-icon>person</mat-icon>{{ event.medecin }}</span>
            }
          </div>
        </div>
      }
      @empty {
        <div class="tl-empty">
          <mat-icon>history</mat-icon>
          <p>Aucun événement médical enregistré</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .timeline { display: flex; flex-direction: column; }
    .timeline-item { display: flex; gap: var(--space-3); }
    .ti-left { display: flex; flex-direction: column; align-items: center; }
    .ti-dot { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; mat-icon { font-size: 18px; }
      &.dot-consultation { background: rgba(0,188,212,0.12); color: var(--color-primary); }
      &.dot-ordonnance { background: rgba(156,39,176,0.12); color: #7B1FA2; }
      &.dot-examen { background: rgba(76,175,80,0.12); color: #2E7D32; }
      &.dot-hospitalisation { background: rgba(33,150,243,0.12); color: #1565C0; }
      &.dot-avis { background: rgba(255,152,0,0.12); color: #E65100; }
      &.dot-urgence { background: rgba(229,57,53,0.12); color: #C62828; }
    }
    .ti-line { flex: 1; width: 2px; background: var(--color-border); margin: 4px 0; }
    .ti-body { flex: 1; padding-bottom: var(--space-5); }
    .ti-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
    .ti-title { font-size: 14px; font-weight: 600; color: var(--color-text); }
    .ti-date { font-size: 11px; color: var(--color-text-muted); }
    .ti-desc { font-size: 13px; color: var(--color-text-muted); margin: 4px 0; line-height: 1.6; }
    .ti-doctor { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--color-text-muted); mat-icon { font-size: 12px; } }
    .tl-empty { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); padding: var(--space-6); color: var(--color-text-muted); text-align: center; mat-icon { font-size: 32px; } p { margin: 0; font-size: 13px; } }
  `]
})
export class TimelineComponent {
  events = input<TimelineEvent[]>([]);

  typeIcon(t: TimelineEvent['type']): string {
    const m: Record<string, string> = { consultation: 'stethoscope', ordonnance: 'description', examen: 'science', hospitalisation: 'bed', avis: 'medical_information', urgence: 'emergency' };
    return m[t] ?? 'event';
  }
}
