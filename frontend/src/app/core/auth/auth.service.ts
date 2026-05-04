import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User, UserRole, ROLE_DEFAULT_ROUTES } from './models/user.model';
import { environment } from '../../../environments/environment';
import { Observable, tap, map, finalize } from 'rxjs';

interface AuthResponse {
  message: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly STORAGE_KEY = 'healthmap_user';
  private readonly API_URL = `${environment.baseUrl}/auth`;

  currentUser = signal<User | null>(this.loadFromStorage());

  private loadFromStorage(): User | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  login(username: string, password: string): Observable<User | null> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, { username, password }).pipe(
      map(res => res.user),
      tap(user => {
        // Clear any onboarding flags left over from a previous session so
        // a brand-new bootstrap admin actually sees the wizard. If the
        // freshly-authenticated user already finished onboarding the
        // wizard's own state will be repopulated from /me.
        this.resetOnboardingState();
        this.currentUser.set(user);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/logout`, {}).pipe(
      finalize(() => {
        this.currentUser.set(null);
        localStorage.removeItem(this.STORAGE_KEY);
        this.resetOnboardingState();
      })
    );
  }

  /**
   * Wipes localStorage flags owned by the OnboardingService. The onboarding
   * service can't easily react to login/logout itself (circular dep), so we
   * do the cleanup here.
   */
  private resetOnboardingState(): void {
    localStorage.removeItem('healthmap_onboarding');
    localStorage.removeItem('healthmap_onboarding_done');
    localStorage.removeItem('healthmap_onboarding_skipped');
  }

  checkAuth(): Observable<User | null> {
    return this.http.get<User>(`${this.API_URL}/me`).pipe(
      tap(user => {
        this.currentUser.set(user);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      }),
      tap({
        error: () => {
          this.currentUser.set(null);
          localStorage.removeItem(this.STORAGE_KEY);
        }
      })
    );
  }

  getUserRole(): UserRole {
    const user = this.currentUser();
    if (!user || !user.roles || user.roles.length === 0) return 'service'; // fallback
    return user.roles[0].role;
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  getDefaultRoute(): string {
    const role = this.getUserRole();
    return ROLE_DEFAULT_ROUTES[role] || '/admin/dashboard';
  }
}
