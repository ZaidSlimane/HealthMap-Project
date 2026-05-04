import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { OnboardingService } from '../../core/services/onboarding.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username = '';
  password = '';
  showPassword = false;
  error = '';
  loading = false;
  usernameFocused = false;
  passwordFocused = false;

  private auth = inject(AuthService);
  private onboarding = inject(OnboardingService);
  private router = inject(Router);

  onSubmit() {
    this.error = '';
    this.loading = true;
    this.auth.login(this.username, this.password).subscribe({
      next: (user) => {
        this.loading = false;
        const dest = this.onboarding.needsOnboarding() ? '/onboarding' : this.auth.getDefaultRoute();
        this.router.navigate([dest]);
      },
      error: (err) => {
        this.loading = false;
        const backendError = err.error?.message ||
                             err.error?.errors?.username?.[0] ||
                             'Une erreur est survenue lors de la connexion. Veuillez réessayer.';
        this.error = backendError;
      }
    });
  }

  fillDemo(u: string, p: string) {
    this.username = u;
    this.password = p;
    this.onSubmit();
  }
}
