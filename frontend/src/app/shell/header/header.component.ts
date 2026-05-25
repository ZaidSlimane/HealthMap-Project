import { Component, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();

  auth = inject(AuthService);
  private router = inject(Router);

  currentTime = '';
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.updateTime();
    this.timer = setInterval(() => this.updateTime(), 1000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  updateTime() {
    this.currentTime = new Date().toLocaleTimeString('fr-FR');
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  /** Full display name: "Prénom Nom", falling back to username */
  displayName(): string {
    const u = this.auth.currentUser();
    if (!u) return '';
    const parts = [u.first_name, u.name].filter(Boolean).join(' ');
    return parts || u.username || '';
  }

  /** Avatar initial from display name, falling back to 'U' */
  userInitial(): string {
    return (this.displayName() || 'U')[0].toUpperCase();
  }
}
