import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEventDto, ScheduleDropEvent } from '../models';

@Component({
  selector: 'app-calendar-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="calendar-panel">
      <p class="calendar-panel-placeholder">Calendrier</p>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .calendar-panel {
      height: 100%;
      background: #fff;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      padding: 16px;
    }

    .calendar-panel-placeholder {
      margin: 0;
      color: #64748b;
      font-size: 14px;
    }
  `],
})
export class CalendarPanelComponent {
  currentView = input.required<string>();
  selectedDate = input.required<Date>();
  events = input.required<CalendarEventDto[]>();
  eventDrop = output<ScheduleDropEvent>();
}
