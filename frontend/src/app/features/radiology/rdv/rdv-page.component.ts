import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { RadiologyRdvFacade } from './services/radiology-rdv.facade';
import { PendingRequestsPanelComponent } from './components/pending-requests-panel.component';
import { CalendarPanelComponent } from './components/calendar-panel.component';
import { DropZoneIndicatorComponent } from './components/drop-zone-indicator.component';
import { RdvToastComponent } from './components/rdv-toast.component';
import { ScheduleDropEvent, DateRange } from './models';

// Register French locale for date formatting
registerLocaleData(localeFr);

@Component({
  selector: 'app-rdv-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    PendingRequestsPanelComponent,
    CalendarPanelComponent,
    DropZoneIndicatorComponent,
    RdvToastComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rdv-page">
      <!-- Page Header -->
      <hm-page-header
        title="Gestion des RDV Radiologie"
        icon="calendar_month"
      >
        <!-- Date navigation controls -->
        <div class="rdv-header-controls">
          <div class="date-nav">
            <button
              class="nav-btn"
              type="button"
              aria-label="Jour précédent"
              (click)="navigatePrevious()"
            >
              <span class="material-icons">chevron_left</span>
            </button>
            <button
              class="nav-btn nav-btn--today"
              type="button"
              (click)="navigateToday()"
            >
              Aujourd'hui
            </button>
            <button
              class="nav-btn"
              type="button"
              aria-label="Jour suivant"
              (click)="navigateNext()"
            >
              <span class="material-icons">chevron_right</span>
            </button>
            <span class="current-date">{{ formattedDate() }}</span>
          </div>

          <!-- View Toggle -->
          <div class="view-toggle" role="group" aria-label="Vue du calendrier">
            <button
              class="view-toggle-btn"
              type="button"
              [class.active]="currentView() === 'timeGridDay'"
              (click)="setView('timeGridDay')"
            >
              Jour
            </button>
            <button
              class="view-toggle-btn"
              type="button"
              [class.active]="currentView() === 'timeGridWeek'"
              (click)="setView('timeGridWeek')"
            >
              Semaine
            </button>
            <button
              class="view-toggle-btn"
              type="button"
              [class.active]="currentView() === 'dayGridMonth'"
              (click)="setView('dayGridMonth')"
            >
              Mois
            </button>
          </div>
        </div>
      </hm-page-header>

      <!-- Main content grid -->
      <div class="rdv-content">
        <!-- Left panel: Pending Requests (300px fixed) -->
        <div class="rdv-left-panel">
          <app-pending-requests-panel />
        </div>

        <!-- Right panel: Calendar (fluid) -->
        <div class="rdv-right-panel">
          <app-drop-zone-indicator [visible]="isDragging()" />
          <app-calendar-panel
            [currentView]="currentView()"
            [selectedDate]="selectedDate()"
            [events]="facade.calendarEvents()"
            (eventDrop)="onEventDrop($event)"
          />
        </div>
      </div>

      <!-- Toast overlay -->
      <app-rdv-toast
        [message]="toastMessage()"
        [visible]="toastVisible()"
        (undo)="onToastUndo()"
        (dismissed)="onToastDismissed()"
      />
    </div>
  `,
  styles: [`
    .rdv-page {
      padding: 24px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .rdv-header-controls {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .date-nav {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e2e8f0;
      background: #fff;
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
      color: #334155;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.15s ease, border-color 0.15s ease;
    }

    .nav-btn:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .nav-btn--today {
      padding: 6px 14px;
    }

    .nav-btn .material-icons {
      font-size: 20px;
    }

    .current-date {
      margin-left: 8px;
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
    }

    .view-toggle {
      display: flex;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }

    .view-toggle-btn {
      border: none;
      background: #fff;
      padding: 6px 16px;
      font-size: 13px;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }

    .view-toggle-btn:not(:last-child) {
      border-right: 1px solid #e2e8f0;
    }

    .view-toggle-btn:hover {
      background: #f8fafc;
    }

    .view-toggle-btn.active {
      background: var(--color-primary, #00BCD4);
      color: #fff;
    }

    .rdv-content {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 20px;
      flex: 1;
      min-height: 0;
    }

    .rdv-left-panel {
      min-height: 0;
      overflow-y: auto;
    }

    .rdv-right-panel {
      position: relative;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
  `],
})
export class RdvPageComponent implements OnInit, OnDestroy {
  readonly facade = inject(RadiologyRdvFacade);

  /** Currently selected date for the calendar view */
  readonly selectedDate = signal<Date>(new Date());

  /** Current calendar view mode */
  readonly currentView = signal<'timeGridDay' | 'timeGridWeek' | 'dayGridMonth'>('timeGridDay');

  /** Whether a drag operation is in progress (controls drop zone visibility) */
  readonly isDragging = signal<boolean>(false);

  /** Toast state */
  readonly toastVisible = signal<boolean>(false);
  readonly toastMessage = signal<string>('');

  /** Last scheduled request ID for undo support */
  private lastScheduledRequestId: number | null = null;

  /** Bound event handlers for cleanup */
  private readonly onDocumentDragStart = () => this.isDragging.set(true);
  private readonly onDocumentDragEnd = () => this.isDragging.set(false);
  private readonly onDocumentDrop = () => this.isDragging.set(false);

  /** Formatted date in French locale */
  readonly formattedDate = computed(() => {
    const date = this.selectedDate();
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  constructor() {
    // Effect: reload calendar events when selectedDate or currentView changes
    effect(() => {
      const date = this.selectedDate();
      const view = this.currentView();
      const range = this.computeDateRange(date, view);
      this.facade.loadCalendarEvents(range);
    });
  }

  ngOnInit(): void {
    // Register drag event listeners for drop zone indicator visibility
    document.addEventListener('dragstart', this.onDocumentDragStart);
    document.addEventListener('dragend', this.onDocumentDragEnd);
    document.addEventListener('drop', this.onDocumentDrop);

    // Load initial data
    this.facade.loadPendingRequests(1); // Default establishment ID
  }

  ngOnDestroy(): void {
    document.removeEventListener('dragstart', this.onDocumentDragStart);
    document.removeEventListener('dragend', this.onDocumentDragEnd);
    document.removeEventListener('drop', this.onDocumentDrop);
  }

  /** Navigate to the previous day/week/month based on current view */
  navigatePrevious(): void {
    const current = this.selectedDate();
    const newDate = new Date(current);

    switch (this.currentView()) {
      case 'timeGridDay':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'timeGridWeek':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'dayGridMonth':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }

    this.selectedDate.set(newDate);
  }

  /** Navigate to today */
  navigateToday(): void {
    this.selectedDate.set(new Date());
  }

  /** Navigate to the next day/week/month based on current view */
  navigateNext(): void {
    const current = this.selectedDate();
    const newDate = new Date(current);

    switch (this.currentView()) {
      case 'timeGridDay':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'timeGridWeek':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'dayGridMonth':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }

    this.selectedDate.set(newDate);
  }

  /** Set the calendar view mode */
  setView(view: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth'): void {
    this.currentView.set(view);
  }

  /** Handle event drop from CalendarPanel — schedule the request via facade */
  onEventDrop(event: ScheduleDropEvent): void {
    this.lastScheduledRequestId = event.requestId;

    this.facade.schedule(event.requestId, event.scheduledAt).subscribe({
      next: (scheduled) => {
        const message = `RDV programmé : ${scheduled.patient_name} à ${this.formatTime(event.scheduledAt)}`;
        this.toastMessage.set(message);
        this.toastVisible.set(true);
      },
      error: () => {
        this.toastMessage.set('Erreur lors de la programmation du RDV');
        this.toastVisible.set(true);
      },
    });
  }

  /** Handle undo from toast — unschedule the last scheduled request */
  onToastUndo(): void {
    if (this.lastScheduledRequestId !== null) {
      this.facade.unschedule(this.lastScheduledRequestId).subscribe({
        error: () => {
          this.toastMessage.set('Erreur : impossible d\'annuler la programmation');
          this.toastVisible.set(true);
        },
      });
      this.lastScheduledRequestId = null;
    }
    this.toastVisible.set(false);
  }

  /** Handle toast dismissed */
  onToastDismissed(): void {
    this.toastVisible.set(false);
    this.lastScheduledRequestId = null;
  }

  /** Format an ISO datetime string to a human-readable French time */
  private formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /** Compute the date range for calendar event loading based on view and selected date */
  private computeDateRange(date: Date, view: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth'): DateRange {
    const from = new Date(date);
    const to = new Date(date);

    switch (view) {
      case 'timeGridDay':
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'timeGridWeek':
        // Start of week (Monday)
        const dayOfWeek = from.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        from.setDate(from.getDate() + diffToMonday);
        from.setHours(0, 0, 0, 0);
        to.setDate(from.getDate() + 6);
        to.setHours(23, 59, 59, 999);
        break;
      case 'dayGridMonth':
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
        to.setMonth(to.getMonth() + 1, 0); // Last day of month
        to.setHours(23, 59, 59, 999);
        break;
    }

    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };
  }
}
