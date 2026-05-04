import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/**
 * Lightweight stub used by sidebar entries whose real pages haven't been
 * built yet (Personnel, Utilisateurs, Box, Borne config, Radiologie config,
 * Laboratoire config…). Reads `data.title` from the route so each entry
 * gets its own labelled landing page instead of all looking identical.
 */
@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="cs-page">
      <div class="cs-card">
        <mat-icon class="cs-icon">construction</mat-icon>
        <h1 class="cs-title">{{ title }}</h1>
        <p class="cs-sub">Cette section sera disponible prochainement.</p>
      </div>
    </div>
  `,
  styles: [`
    .cs-page { display: grid; place-items: center; min-height: 70vh; padding: 32px; }
    .cs-card {
      max-width: 480px; width: 100%; text-align: center;
      background: #fff; border: 1px solid #E2E8F0; border-radius: 16px;
      padding: 40px 32px; box-shadow: 0 1px 3px rgba(15,23,42,.05);
    }
    .cs-icon { font-size: 56px; width: 56px; height: 56px; color: #00BCD4; margin-bottom: 8px; }
    .cs-title { font-family: var(--font-heading); font-size: 1.25rem; color: #0F172A; margin: 8px 0 4px; }
    .cs-sub { color: #64748B; font-size: 14px; margin: 0; }
  `],
})
export class ComingSoonComponent {
  private readonly route = inject(ActivatedRoute);
  /** Pulled from route data; defaults to a generic French label. */
  readonly title: string = this.route.snapshot.data['title'] ?? 'Section à venir';
}
