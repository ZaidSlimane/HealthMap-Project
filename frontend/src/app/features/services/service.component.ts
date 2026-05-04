import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { PatientService, Patient } from '../../core/services/patient.service';

const SERVICE_LABELS: Record<string, string> = {
  urgences: 'URGENCES MEDICO-CHIRURGICALES',
  cardio: 'CARDIOLOGIE',
  hemodialyse: 'HÉMODIALYSE',
  gyneco: 'GYNÉCOLOGIE OBSTÉTRIQUE',
};

@Component({
  selector: 'app-service',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule],
  template: `
    <div class="page-container page-fade-in">
      <div class="service-header urgent-stripe">
        <mat-icon style="color:white;font-size:24px">local_hospital</mat-icon>
        <h2 style="color:white;margin:0;font-size:20px;font-weight:700;">{{ serviceLabel }}</h2>
      </div>
      <div class="card-surface" style="margin-top:16px">
        <table mat-table [dataSource]="patients">
          <ng-container matColumnDef="queueNumber">
            <th mat-header-cell *matHeaderCellDef>N° File</th>
            <td mat-cell *matCellDef="let row"><strong>{{ row.queueNumber }}</strong></td>
          </ng-container>
          <ng-container matColumnDef="fullName">
            <th mat-header-cell *matHeaderCellDef>Nom complet</th>
            <td mat-cell *matCellDef="let row">{{ row.fullName }}</td>
          </ng-container>
          <ng-container matColumnDef="medecin">
            <th mat-header-cell *matHeaderCellDef>Médecin</th>
            <td mat-cell *matCellDef="let row">{{ row.medecin }}</td>
          </ng-container>
          <ng-container matColumnDef="statut">
            <th mat-header-cell *matHeaderCellDef>Statut</th>
            <td mat-cell *matCellDef="let row">
              <span [style.background]="row.statut==='urgence'?'#E53935':'#43A047'"
                    style="color:white;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:600;">
                {{ row.statut }}
              </span>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let r; columns: cols;"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [`.service-header{display:flex;align-items:center;gap:12px;padding:16px 24px;border-radius:8px;}`]
})
export class ServiceComponent {
  private route = inject(ActivatedRoute);
  private patientService = inject(PatientService);
  cols = ['queueNumber', 'fullName', 'medecin', 'statut'];
  serviceId = this.route.snapshot.paramMap.get('serviceId') || '';
  serviceLabel = SERVICE_LABELS[this.serviceId] || this.serviceId.toUpperCase();
  patients: Patient[] = this.patientService.getPatients().filter(p => p.statut === 'urgence');
}
