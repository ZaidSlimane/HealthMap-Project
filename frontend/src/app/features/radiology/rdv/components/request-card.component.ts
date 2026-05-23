import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RadioDemandeDto } from '../models';

@Component({
  selector: 'app-request-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="request-card"
      [attr.data-request-id]="request().id"
      [style.border-left-color]="borderColor()"
      draggable="true"
      (dragstart)="onDragStart($event)"
    >
      <!-- Delete button (top-right) -->
      <button
        class="rc-delete-btn"
        type="button"
        aria-label="Supprimer la demande"
        (click)="delete.emit(request().id)"
      >
        <span class="material-icons">close</span>
      </button>

      <!-- Urgence badge -->
      @if (request().urgency === 'urgente') {
        <span class="rc-urgence-badge">Urgent</span>
      }

      <!-- Patient name -->
      <p class="rc-patient-name">{{ request().patient_name }}</p>

      <!-- Service name -->
      <p class="rc-service-name">{{ request().service_name }}</p>

      <!-- Exam type with icon -->
      <div class="rc-exam-type">
        <span class="material-icons rc-exam-icon">{{ request().exam_type_icon }}</span>
        <span class="rc-exam-label">{{ request().exam_type }}</span>
      </div>

      <!-- Bypass button -->
      <button
        class="rc-bypass-btn"
        type="button"
        (click)="bypass.emit(request().id)"
      >
        Passer sans RDV
      </button>
    </div>
  `,
  styles: [`
    .request-card {
      position: relative;
      background: #fff;
      border-radius: 8px;
      border-left: 4px solid;
      padding: 12px 14px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      cursor: grab;
      transition: box-shadow 0.15s ease;
    }

    .request-card:active {
      cursor: grabbing;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .rc-delete-btn {
      position: absolute;
      top: 6px;
      right: 6px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;
      color: #94a3b8;
      line-height: 1;
      transition: color 0.15s ease, background 0.15s ease;
    }

    .rc-delete-btn:hover {
      color: #dc2626;
      background: rgba(220, 38, 38, 0.08);
    }

    .rc-delete-btn .material-icons {
      font-size: 18px;
    }

    .rc-urgence-badge {
      display: inline-block;
      background: #dc2626;
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 999px;
      margin-bottom: 6px;
    }

    .rc-patient-name {
      margin: 0 0 2px;
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }

    .rc-service-name {
      margin: 0 0 8px;
      font-size: 12px;
      color: #64748b;
    }

    .rc-exam-type {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 10px;
    }

    .rc-exam-icon {
      font-size: 18px;
      color: #475569;
    }

    .rc-exam-label {
      font-size: 13px;
      color: #334155;
    }

    .rc-bypass-btn {
      display: block;
      width: 100%;
      background: none;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      padding: 6px 0;
      font-size: 12px;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      transition: border-color 0.15s ease, color 0.15s ease;
    }

    .rc-bypass-btn:hover {
      border-color: #0ea5e9;
      color: #0ea5e9;
    }
  `],
})
export class RequestCardComponent {
  /** The radio demande request to display */
  request = input.required<RadioDemandeDto>();

  /** Emits the request ID when the delete button is clicked */
  delete = output<number>();

  /** Emits the request ID when the bypass button is clicked */
  bypass = output<number>();

  /** Returns the left border color based on urgency level */
  borderColor(): string {
    switch (this.request().urgency) {
      case 'normale':
        return '#2563eb';
      case 'semi-urgente':
        return '#ea580c';
      case 'urgente':
        return '#dc2626';
      default:
        return '#2563eb';
    }
  }

  /** Handles HTML5 dragstart event, sets request data in dataTransfer */
  onDragStart(event: DragEvent): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData(
        'application/json',
        JSON.stringify(this.request())
      );
      event.dataTransfer.effectAllowed = 'move';
    }
  }
}
