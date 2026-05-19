import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * ResumeTabComponent — Three-column clinical overview for the Résumé tab.
 *
 * Left column:   Feuilles de flux, Diagnostic, Bilan psychologique, Antécédents médicaux, Fichiers
 * Center column: Observations médicales, Allergies, Médicaments
 * Right column:  Vital_Signs_Panel (placeholder), Acte chirurgical, Rendez-vous
 */
@Component({
  selector: 'app-resume-tab',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="resume-grid">
      <!-- Left Column -->
      <div class="resume-column">
        <section class="resume-section">
          <h4 class="section-title">Feuilles de flux</h4>
          @if (feuillesDeFlux().length === 0) {
            <p class="empty-state">Aucune feuille de flux enregistrée.</p>
          } @else {
            <ul class="section-list">
              @for (item of feuillesDeFlux(); track item) {
                <li class="section-item">{{ item }}</li>
              }
            </ul>
          }
        </section>

        <section class="resume-section">
          <h4 class="section-title">Diagnostic</h4>
          @if (diagnostics().length === 0) {
            <p class="empty-state">Aucun diagnostic enregistré.</p>
          } @else {
            <ul class="section-list">
              @for (item of diagnostics(); track item) {
                <li class="section-item">{{ item }}</li>
              }
            </ul>
          }
        </section>

        <section class="resume-section">
          <h4 class="section-title">Bilan psychologique</h4>
          @if (bilanPsychologique().length === 0) {
            <p class="empty-state">Aucun bilan psychologique enregistré.</p>
          } @else {
            <ul class="section-list">
              @for (item of bilanPsychologique(); track item) {
                <li class="section-item">{{ item }}</li>
              }
            </ul>
          }
        </section>

        <section class="resume-section">
          <h4 class="section-title">Antécédents médicaux</h4>
          @if (antecedentsMedicaux().length === 0) {
            <p class="empty-state">Aucun antécédent médical enregistré.</p>
          } @else {
            <ul class="section-list">
              @for (item of antecedentsMedicaux(); track item) {
                <li class="section-item">{{ item }}</li>
              }
            </ul>
          }
        </section>

        <section class="resume-section">
          <h4 class="section-title">Fichiers</h4>
          @if (fichiers().length === 0) {
            <p class="empty-state">Aucun fichier enregistré.</p>
          } @else {
            <ul class="section-list">
              @for (item of fichiers(); track item) {
                <li class="section-item">{{ item }}</li>
              }
            </ul>
          }
        </section>
      </div>

      <!-- Center Column -->
      <div class="resume-column">
        <section class="resume-section">
          <h4 class="section-title">Observations médicales</h4>
          @if (observationsMedicales().length === 0) {
            <p class="empty-state">Aucune observation médicale enregistrée.</p>
          } @else {
            <ul class="section-list">
              @for (item of observationsMedicales(); track item) {
                <li class="section-item">{{ item }}</li>
              }
            </ul>
          }
        </section>

        <section class="resume-section">
          <h4 class="section-title">Allergies</h4>
          @if (allergies().length === 0) {
            <p class="empty-state">Aucune allergie enregistrée.</p>
          } @else {
            <ul class="section-list">
              @for (item of allergies(); track item) {
                <li class="section-item">{{ item }}</li>
              }
            </ul>
          }
        </section>

        <section class="resume-section">
          <h4 class="section-title">Médicaments</h4>
          @if (medicaments().length === 0) {
            <p class="empty-state">Aucun médicament enregistré.</p>
          } @else {
            <ul class="section-list">
              @for (item of medicaments(); track item) {
                <li class="section-item">{{ item }}</li>
              }
            </ul>
          }
        </section>
      </div>

      <!-- Right Column -->
      <div class="resume-column">
        <section class="resume-section vital-signs-slot">
          <h4 class="section-title">Signes vitaux</h4>
          <!-- VitalSignsPanelComponent will be wired here in a later task -->
          <ng-content select="[vitalSignsSlot]"></ng-content>
          @if (!hasVitalSignsContent()) {
            <p class="empty-state">Panneau des signes vitaux à configurer.</p>
          }
        </section>

        <section class="resume-section">
          <h4 class="section-title">Acte chirurgical</h4>
          @if (actesChirurgicaux().length === 0) {
            <p class="empty-state">Aucun acte chirurgical enregistré.</p>
          } @else {
            <ul class="section-list">
              @for (item of actesChirurgicaux(); track item) {
                <li class="section-item">{{ item }}</li>
              }
            </ul>
          }
        </section>

        <section class="resume-section">
          <h4 class="section-title">Rendez-vous</h4>
          @if (rendezVous().length === 0) {
            <p class="empty-state">Aucun rendez-vous enregistré.</p>
          } @else {
            <ul class="section-list">
              @for (item of rendezVous(); track item) {
                <li class="section-item">{{ item }}</li>
              }
            </ul>
          }
        </section>
      </div>
    </div>
  `,
  styles: [`
    .resume-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      align-items: start;
    }

    @media (max-width: 1200px) {
      .resume-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 768px) {
      .resume-grid {
        grid-template-columns: 1fr;
      }
    }

    .resume-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .resume-section {
      background: var(--color-bg, #f8fafc);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      padding: 14px 16px;
    }

    .section-title {
      margin: 0 0 10px 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .empty-state {
      margin: 0;
      font-size: 12px;
      color: var(--color-text-muted, #94a3b8);
      font-style: italic;
    }

    .section-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .section-item {
      padding: 6px 0;
      font-size: 13px;
      color: var(--color-text, #0f172a);
      border-bottom: 1px solid var(--color-border, #e2e8f0);
    }

    .section-item:last-child {
      border-bottom: none;
    }

    .vital-signs-slot {
      min-height: 80px;
    }
  `]
})
export class ResumeTabComponent {
  // Left column inputs
  readonly feuillesDeFlux = input<any[]>([]);
  readonly diagnostics = input<any[]>([]);
  readonly bilanPsychologique = input<any[]>([]);
  readonly antecedentsMedicaux = input<any[]>([]);
  readonly fichiers = input<any[]>([]);

  // Center column inputs
  readonly observationsMedicales = input<any[]>([]);
  readonly allergies = input<any[]>([]);
  readonly medicaments = input<any[]>([]);

  // Right column inputs
  readonly hasVitalSignsContent = input<boolean>(false);
  readonly actesChirurgicaux = input<any[]>([]);
  readonly rendezVous = input<any[]>([]);
}
