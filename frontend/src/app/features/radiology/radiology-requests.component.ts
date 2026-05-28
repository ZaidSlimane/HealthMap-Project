import { Component, inject, signal, OnInit, ChangeDetectionStrategy, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router } from '@angular/router';
import { RadioService } from './services/radio.service';
import { NotificationService } from '../../core/services/notification.service';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner.component';

@Component({
  selector: 'app-radiology-requests',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterModule, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './radiology-requests.component.html',
  styleUrl: './radiology-requests.component.scss',
})
export class RadiologyRequestsComponent implements OnInit {
  private readonly radioService = inject(RadioService);
  private readonly notifs        = inject(NotificationService);
  private readonly router        = inject(Router);

  readonly requests  = signal<any[]>([]);
  readonly loading   = signal(true);
  readonly error     = signal('');

  // Calendar state
  calendarView: 'mois' | 'semaine' | 'jour' = 'jour';
  calendarDate = new Date();
  hours = Array.from({ length: 13 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);

  private lastKnownPending = -1;

  // Isolated computed — only radio_pending, not the whole counts object
  private readonly radioPending = computed(() => this.notifs.counts().radio_pending);

  constructor() {
    // Only re-fetch when radio_pending specifically changes value
    effect(() => {
      const pending = this.radioPending();
      if (this.lastKnownPending !== -1 && pending !== this.lastKnownPending) {
        this.loadRequests();
      }
      this.lastKnownPending = pending;
    });
  }

  ngOnInit(): void {
    this.loadRequests();
  }

  private loadRequests(): void {
    this.loading.set(true);
    this.radioService.getWorklist().subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : (res.data ?? []);
        this.requests.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les demandes.');
        this.loading.set(false);
      },
    });
  }

  openDetail(id: number): void {
    this.router.navigate(['/radiology/requests', id]);
  }

  // ── Calendar navigation ──────────────────────────────────────────────────
  get formattedDate(): string {
    return this.calendarDate.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  prevDay():  void { this.calendarDate = new Date(this.calendarDate.getTime() - 86_400_000); }
  nextDay():  void { this.calendarDate = new Date(this.calendarDate.getTime() + 86_400_000); }
  goToday():  void { this.calendarDate = new Date(); }

  // ── Helpers ──────────────────────────────────────────────────────────────
  examLabel(item: any): string {
    return item.exam_type?.label ?? item.examType?.label ?? '—';
  }

  patientLabel(item: any): string {
    const p = item.patient;
    if (!p) return '—';
    return [p.name, p.first_name].filter(Boolean).join(' ') || '—';
  }

  statusClass(status: string): string {
    return { pending: 'badge-pending', in_progress: 'badge-progress', completed: 'badge-done', cancelled: 'badge-cancelled' }[status] ?? '';
  }

  statusLabel(status: string): string {
    return { pending: 'En attente', in_progress: 'En cours', completed: 'Terminé', cancelled: 'Annulé' }[status] ?? status;
  }
}
