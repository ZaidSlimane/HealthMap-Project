import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OnboardingService } from '../../core/services/onboarding.service';
import { AuthService } from '../../core/auth/auth.service';
import { ONBOARDING_STEPS, OnboardingStep } from '../../core/auth/models/onboarding.model';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
})
export class OnboardingComponent implements OnInit {
  private readonly onboarding = inject(OnboardingService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly steps = ONBOARDING_STEPS;

  // Reference data — fetched from the backend on init.
  readonly wilayas = this.onboarding.wilayas;
  readonly establishmentTypes = this.onboarding.establishmentTypes;
  readonly filteredEstablishments = this.onboarding.filteredEstablishments;
  readonly loadingEstablishments = this.onboarding.loadingEstablishments;

  readonly currentStep = this.onboarding.currentStep;
  readonly profile = this.onboarding.profile;

  // Search filters (client-side over the already-filtered API results).
  wilayaSearch = '';
  establishmentSearch = '';

  // Password form state — the wizard now sets the brand-new establishment
  // admin's password atomically via /onboarding/complete, so there's no
  // "current password" to verify (the bootstrap account uses a hardcoded one).
  newPassword = '';
  confirmPassword = '';
  showNewPassword = false;
  showConfirmPassword = false;
  passwordError = '';
  completingOnboarding = false;
  completionError = '';

  // ── Custom establishment form ─────────────────────────────────────────
  showCustomForm = signal(false);
  customName = '';
  customNameAr = '';
  customAddress = '';
  customPhone = '';
  customEmail = '';
  customError = '';
  customLoading = false;

  readonly currentStepIndex = computed(() => {
    const key = this.currentStep();
    return this.steps.findIndex(s => s.key === key);
  });

  readonly filteredWilayas = computed(() => {
    const search = this.wilayaSearch.toLowerCase().trim();
    const list = this.wilayas();
    if (!search) return list;
    return list.filter(w =>
      w.name.toLowerCase().includes(search) ||
      w.code.toString().includes(search)
    );
  });

  readonly filteredEstablishmentList = computed(() => {
    const search = this.establishmentSearch.toLowerCase().trim();
    const all = this.filteredEstablishments();
    if (!search) return all;
    return all.filter(e => e.name.toLowerCase().includes(search));
  });

  readonly canGoNext = computed(() => {
    const step = this.currentStep();
    const p = this.profile();
    switch (step) {
      case 'type': return p.establishmentType !== null;
      case 'wilaya': return p.wilayaCode !== null;
      case 'establishment': return p.establishmentId !== null;
      case 'password': return true;
      default: return false;
    }
  });

  /** True once the new admin password has been entered and confirmed. */
  passwordValid(): boolean {
    return this.newPassword.length >= 8 &&
           this.newPassword === this.confirmPassword;
  }

  /** Lookup helpers for the templates. */
  typeLabel(code: string | null): string {
    if (!code) return '';
    return this.establishmentTypes().find(t => t.code === code)?.label ?? code;
  }

  ngOnInit(): void {
    // Reference data is small (58 wilayas + 8 types) — load both eagerly so
    // step navigation is instant.
    this.onboarding.loadWilayas().subscribe({ error: () => {} });
    this.onboarding.loadEstablishmentTypes().subscribe({ error: () => {} });

    // If the user resumed mid-wizard, restore the matching establishments list.
    if (this.profile().wilayaCode !== null) {
      this.onboarding.loadEstablishments().subscribe({ error: () => {} });
    }
  }

  // ── Step pickers ──────────────────────────────────────────────────────
  selectType(code: string): void {
    this.onboarding.setEstablishmentType(code);
  }

  selectWilaya(code: number): void {
    this.onboarding.setWilaya(code);
    this.establishmentSearch = '';
  }

  selectEstablishment(slug: string): void {
    this.onboarding.setEstablishment(slug);
  }

  // ── Wizard navigation ─────────────────────────────────────────────────
  nextStep(): void {
    const idx = this.currentStepIndex();
    if (idx < this.steps.length - 1) {
      const target = this.steps[idx + 1].key;
      this.onboarding.goToStep(target);
      // Lazy-fetch the directory when the user arrives at step 3.
      if (target === 'establishment') {
        this.onboarding.loadEstablishments().subscribe({ error: () => {} });
      }
    }
  }

  prevStep(): void {
    const idx = this.currentStepIndex();
    if (idx > 0) {
      this.onboarding.goToStep(this.steps[idx - 1].key);
    }
  }

  goToStep(step: OnboardingStep): void {
    const targetIdx = this.steps.findIndex(s => s.key === step);
    const currentIdx = this.currentStepIndex();
    if (targetIdx <= currentIdx || this.isStepAccessible(step)) {
      this.onboarding.goToStep(step);
      if (step === 'establishment') {
        this.onboarding.loadEstablishments().subscribe({ error: () => {} });
      }
    }
  }

  isStepAccessible(step: OnboardingStep): boolean {
    const p = this.profile();
    switch (step) {
      case 'type': return true;
      case 'wilaya': return p.establishmentType !== null;
      case 'establishment': return p.establishmentType !== null && p.wilayaCode !== null;
      case 'password': return p.establishmentType !== null && p.wilayaCode !== null && p.establishmentId !== null;
      default: return false;
    }
  }

  isStepCompleted(step: OnboardingStep): boolean {
    const p = this.profile();
    switch (step) {
      case 'type': return p.establishmentType !== null;
      case 'wilaya': return p.wilayaCode !== null;
      case 'establishment': return p.establishmentId !== null;
      // Step is "complete" once the user has typed a valid new password —
      // the actual server-side change happens on /onboarding/complete.
      case 'password': return this.passwordValid();
      default: return false;
    }
  }

  // ── Custom establishment ──────────────────────────────────────────────
  toggleCustomForm(): void {
    this.showCustomForm.update(v => !v);
    this.customError = '';
  }

  submitCustomEstablishment(): void {
    this.customError = '';
    const p = this.profile();

    if (!this.customName.trim() || !p.establishmentType || p.wilayaCode == null) {
      this.customError = 'Veuillez compléter les étapes précédentes.';
      return;
    }

    this.customLoading = true;
    this.onboarding.createCustomEstablishment({
      name: this.customName.trim(),
      name_ar: this.customNameAr.trim() || undefined,
      type: p.establishmentType,
      wilaya_code: p.wilayaCode,
      address: this.customAddress.trim() || undefined,
      phone: this.customPhone.trim() || undefined,
      email: this.customEmail.trim() || undefined,
    }).subscribe({
      next: () => {
        this.customLoading = false;
        this.showCustomForm.set(false);
        this.customName = '';
        this.customNameAr = '';
        this.customAddress = '';
        this.customPhone = '';
        this.customEmail = '';
      },
      error: (err) => {
        this.customLoading = false;
        const errs = err?.error?.errors;
        if (errs) {
          this.customError = Object.values(errs).flat().join(' ');
        } else {
          this.customError = err?.error?.message || 'Erreur lors de la création de l\'établissement.';
        }
      },
    });
  }

  // ── Finish ────────────────────────────────────────────────────────────
  /**
   * Submits the entire wizard atomically: establishment trio + the
   * new admin password go in one POST. Backend creates the dedicated
   * establishment admin user and switches our session to it.
   */
  finish(): void {
    this.completionError = '';
    this.passwordError = '';

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Les mots de passe ne correspondent pas.';
      return;
    }
    if (this.newPassword.length < 8) {
      this.passwordError = 'Le mot de passe doit contenir au moins 8 caractères.';
      return;
    }

    this.completingOnboarding = true;
    this.onboarding.completeOnboarding(this.newPassword).subscribe({
      next: () => {
        this.completingOnboarding = false;
        this.router.navigate([this.auth.getDefaultRoute()]);
      },
      error: (err) => {
        this.completingOnboarding = false;
        const errs = err?.error?.errors;
        if (errs?.new_password) {
          this.passwordError = errs.new_password[0];
        } else {
          this.completionError = err?.error?.message || 'Erreur lors de la finalisation.';
        }
      },
    });
  }

  skip(): void {
    this.onboarding.skipOnboarding();
    this.router.navigate([this.auth.getDefaultRoute()]);
  }

  // ── Display helpers ───────────────────────────────────────────────────
  getWilayaName(code: number): string {
    return this.wilayas().find(w => w.code === code)?.name ?? '';
  }

  getEstablishmentName(slug: string): string {
    return this.filteredEstablishments().find(e => e.slug === slug)?.name ?? '';
  }
}
