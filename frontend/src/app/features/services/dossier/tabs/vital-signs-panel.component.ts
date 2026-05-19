import { Component, ChangeDetectionStrategy, input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface VitalSignType {
  id: number;
  label: string;
  unit: string;
  icon: string;
  color: string;
}

export interface VitalSign {
  id: number;
  vital_sign_type_id: number;
  admission_id: number;
  patient_id: number;
  value: number;
  measured_at: string;
  type?: VitalSignType;
}

// ─── Vital Sign Type Definitions ──────────────────────────────────────────────

export interface VitalSignTypeConfig {
  id: number;
  label: string;
  unit: string;
  min: number;
  max: number;
  icon: string;
}

export const VITAL_SIGN_TYPES: VitalSignTypeConfig[] = [
  { id: 1, label: 'Température', unit: '°C', min: 34, max: 42, icon: 'thermostat' },
  { id: 2, label: 'Taille', unit: 'cm', min: 30, max: 250, icon: 'height' },
  { id: 3, label: 'Poids', unit: 'kg', min: 0.5, max: 500, icon: 'monitor_weight' },
  { id: 4, label: 'Pouls', unit: 'bpm', min: 20, max: 250, icon: 'favorite' },
  { id: 5, label: 'Tension artérielle', unit: 'mmHg', min: 40, max: 300, icon: 'speed' },
  { id: 6, label: 'Glycémie', unit: 'g/L', min: 0.1, max: 10, icon: 'water_drop' },
];

// ─── Pure Functions ───────────────────────────────────────────────────────────

/**
 * Computes the IMC (Body Mass Index) from height in cm and weight in kg.
 * Returns the result rounded to 1 decimal place.
 * Formula: weight / (height/100)²
 */
export function computeIMC(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  const imc = weightKg / (heightM * heightM);
  return Math.round(imc * 10) / 10;
}

/**
 * Selects the most recent vital sign measurement for a given type ID.
 * Returns null if no measurements exist for that type.
 */
export function selectMostRecent(signs: VitalSign[], typeId: number): VitalSign | null {
  const filtered = signs.filter(s => s.vital_sign_type_id === typeId);
  if (filtered.length === 0) return null;

  return filtered.reduce((latest, current) => {
    return new Date(current.measured_at).getTime() > new Date(latest.measured_at).getTime()
      ? current
      : latest;
  });
}

/**
 * Validates a vital sign value for a given type label.
 * Returns null if valid, or an error message string if invalid.
 *
 * Physiological ranges:
 * - Température: 34–42 °C
 * - Taille: 30–250 cm
 * - Poids: 0.5–500 kg
 * - Pouls: 20–250 bpm
 * - Tension artérielle: 40–300 mmHg
 * - Glycémie: 0.1–10 g/L
 */
export function validateVitalSign(typeLabel: string, value: number): string | null {
  if (value === null || value === undefined || isNaN(value)) {
    return 'La valeur doit être numérique';
  }

  const config = VITAL_SIGN_TYPES.find(t => t.label === typeLabel);
  if (!config) {
    return `Type de signe vital inconnu: ${typeLabel}`;
  }

  if (value < config.min || value > config.max) {
    return `La valeur doit être entre ${config.min} et ${config.max} ${config.unit}`;
  }

  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-vital-signs-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="vital-signs-panel">
      <div class="panel-header">
        <span class="material-icons panel-icon">monitor_heart</span>
        <h3 class="panel-title">Signes vitaux</h3>
      </div>

      <!-- IMC Display -->
      @if (imcValue() !== null) {
        <div class="imc-display">
          <span class="imc-label">IMC</span>
          <span class="imc-value">{{ imcValue() }}</span>
          <span class="imc-unit">kg/m²</span>
        </div>
      }

      <!-- Vital Signs Grid -->
      <div class="vital-grid">
        @for (typeConfig of vitalSignTypes; track typeConfig.id) {
          <div class="vital-item">
            <div class="vital-header">
              <span class="material-icons vital-icon">{{ typeConfig.icon }}</span>
              <span class="vital-label">{{ typeConfig.label }}</span>
            </div>

            <!-- Current value -->
            <div class="vital-current">
              @if (getMostRecentValue(typeConfig.id); as sign) {
                <span class="vital-value">{{ sign.value }}</span>
                <span class="vital-unit">{{ typeConfig.unit }}</span>
              } @else {
                <span class="vital-empty">—</span>
              }
            </div>

            <!-- Input field -->
            <div class="vital-input-row">
              <input
                type="text"
                class="vital-input"
                [placeholder]="typeConfig.unit"
                [attr.aria-label]="'Nouvelle valeur ' + typeConfig.label"
                [(ngModel)]="inputValues[typeConfig.id]"
                (keydown.enter)="submitVitalSign(typeConfig)"
              />
              <button
                class="btn-submit"
                [disabled]="submitting()"
                (click)="submitVitalSign(typeConfig)"
                [attr.aria-label]="'Enregistrer ' + typeConfig.label"
              >
                <span class="material-icons">check</span>
              </button>
            </div>

            <!-- Validation error -->
            @if (errors[typeConfig.id]) {
              <div class="vital-error">{{ errors[typeConfig.id] }}</div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .vital-signs-panel {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .panel-icon {
      font-size: 20px;
      color: var(--color-primary, #00BCD4);
    }

    .panel-title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text, #0f172a);
    }

    .imc-display {
      display: flex;
      align-items: baseline;
      gap: 6px;
      padding: 8px 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: var(--radius-md, 10px);
    }

    .imc-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: #16a34a;
    }

    .imc-value {
      font-size: 18px;
      font-weight: 700;
      color: #15803d;
    }

    .imc-unit {
      font-size: 11px;
      color: #16a34a;
      opacity: 0.8;
    }

    .vital-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .vital-item {
      padding: 10px 12px;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      background: var(--color-surface, #fff);
    }

    .vital-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
    }

    .vital-icon {
      font-size: 16px;
      color: var(--color-text-muted, #64748b);
    }

    .vital-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text, #0f172a);
    }

    .vital-current {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin-bottom: 8px;
    }

    .vital-value {
      font-size: 16px;
      font-weight: 700;
      color: var(--color-text, #0f172a);
    }

    .vital-unit {
      font-size: 11px;
      color: var(--color-text-muted, #64748b);
    }

    .vital-empty {
      font-size: 14px;
      color: var(--color-text-muted, #64748b);
      opacity: 0.5;
    }

    .vital-input-row {
      display: flex;
      gap: 6px;
    }

    .vital-input {
      flex: 1;
      padding: 6px 10px;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-sm, 6px);
      font-size: 12px;
      outline: none;
      transition: border-color 0.2s ease;
    }

    .vital-input:focus {
      border-color: var(--color-primary, #00BCD4);
    }

    .btn-submit {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: var(--radius-sm, 6px);
      background: var(--color-primary, #00BCD4);
      color: #fff;
      cursor: pointer;
      transition: opacity 0.2s ease;
    }

    .btn-submit:hover:not(:disabled) {
      opacity: 0.85;
    }

    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-submit .material-icons {
      font-size: 16px;
    }

    .vital-error {
      margin-top: 4px;
      font-size: 11px;
      color: #dc2626;
    }
  `]
})
export class VitalSignsPanelComponent {
  private readonly http = inject(HttpClient);
  private readonly API = environment.baseUrl;

  /** Input: array of vital signs with type info */
  readonly vitalSigns = input.required<VitalSign[]>();

  /** Admission and patient IDs for POST requests */
  readonly admissionId = input.required<number>();
  readonly patientId = input.required<number>();

  /** Internal state */
  readonly submitting = signal(false);
  readonly localSigns = signal<VitalSign[]>([]);

  /** Type configurations */
  readonly vitalSignTypes = VITAL_SIGN_TYPES;

  /** Input values for each type (keyed by type ID) */
  inputValues: Record<number, string> = {};

  /** Validation errors for each type (keyed by type ID) */
  errors: Record<number, string | null> = {};

  /** Computed IMC value from most recent height and weight */
  readonly imcValue = computed(() => {
    const allSigns = [...this.vitalSigns(), ...this.localSigns()];
    const heightSign = selectMostRecent(allSigns, 2); // height type id = 2
    const weightSign = selectMostRecent(allSigns, 3); // weight type id = 3

    if (heightSign && weightSign && heightSign.value > 0 && weightSign.value > 0) {
      return computeIMC(heightSign.value, weightSign.value);
    }
    return null;
  });

  /**
   * Gets the most recent value for a given vital sign type,
   * considering both input data and locally added signs.
   */
  getMostRecentValue(typeId: number): VitalSign | null {
    const allSigns = [...this.vitalSigns(), ...this.localSigns()];
    return selectMostRecent(allSigns, typeId);
  }

  /**
   * Validates and submits a new vital sign measurement.
   */
  submitVitalSign(typeConfig: VitalSignTypeConfig): void {
    const rawValue = this.inputValues[typeConfig.id] ?? '';

    // Check if empty
    if (rawValue.trim() === '') {
      this.errors[typeConfig.id] = 'La valeur est requise';
      return;
    }

    const numValue = Number(rawValue);

    // Check if numeric
    if (isNaN(numValue)) {
      this.errors[typeConfig.id] = 'La valeur doit être numérique';
      return;
    }

    // Use the pure validateVitalSign function for range validation
    const error = validateVitalSign(typeConfig.label, numValue);
    if (error !== null) {
      this.errors[typeConfig.id] = error;
      return;
    }

    // Clear error
    this.errors[typeConfig.id] = null;
    this.submitting.set(true);

    const payload = {
      vital_sign_type_id: typeConfig.id,
      admission_id: this.admissionId(),
      patient_id: this.patientId(),
      value: numValue,
      measured_at: new Date().toISOString(),
    };

    this.http.post<VitalSign>(`${this.API}/clinical-core/vital-signs`, payload).subscribe({
      next: (newSign) => {
        // Update local signs to reflect the new measurement
        this.localSigns.update(signs => [...signs, {
          ...newSign,
          vital_sign_type_id: typeConfig.id,
          value: numValue,
          measured_at: payload.measured_at,
          admission_id: this.admissionId(),
          patient_id: this.patientId(),
          id: newSign?.id ?? Date.now(),
        }]);
        // Clear input
        this.inputValues[typeConfig.id] = '';
        this.submitting.set(false);
      },
      error: () => {
        this.errors[typeConfig.id] = 'Erreur lors de l\'enregistrement. Veuillez réessayer.';
        this.submitting.set(false);
      }
    });
  }
}
