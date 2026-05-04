export interface OnboardingProfile {
  /** EstablishmentType.code (e.g. "CHU"). */
  establishmentType: string | null;
  /** Wilaya.code (1..58). */
  wilayaCode: number | null;
  /** Establishment.slug (e.g. "chu-constantine"). */
  establishmentId: string | null;
  passwordChanged: boolean;
}

export type OnboardingStep = 'type' | 'wilaya' | 'establishment' | 'password';

export const ONBOARDING_STEPS: { key: OnboardingStep; label: string; icon: string }[] = [
  { key: 'type', label: 'Type d\'établissement', icon: 'domain' },
  { key: 'wilaya', label: 'Wilaya', icon: 'location_on' },
  { key: 'establishment', label: 'Établissement', icon: 'local_hospital' },
  { key: 'password', label: 'Mot de passe', icon: 'lock' },
];
