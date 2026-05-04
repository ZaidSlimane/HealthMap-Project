import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface Medecin { nom: string; specialite: string; service: string; boxNumber: number; actif: boolean; }

@Component({
  selector: 'app-medecins',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule],
  template: `
    <div class="page-container page-fade-in">
      <h2 class="section-title"><mat-icon>people</mat-icon> Médecins</h2>
      <div class="card-surface">
        <table mat-table [dataSource]="medecins">
          <ng-container matColumnDef="no">
            <th mat-header-cell *matHeaderCellDef>#</th>
            <td mat-cell *matCellDef="let row; let i = index">{{ i + 1 }}</td>
          </ng-container>
          <ng-container matColumnDef="nom">
            <th mat-header-cell *matHeaderCellDef>Nom complet</th>
            <td mat-cell *matCellDef="let row"><strong>{{ row.nom }}</strong></td>
          </ng-container>
          <ng-container matColumnDef="specialite">
            <th mat-header-cell *matHeaderCellDef>Spécialité</th>
            <td mat-cell *matCellDef="let row">{{ row.specialite }}</td>
          </ng-container>
          <ng-container matColumnDef="service">
            <th mat-header-cell *matHeaderCellDef>Service</th>
            <td mat-cell *matCellDef="let row">{{ row.service }}</td>
          </ng-container>
          <ng-container matColumnDef="boxNumber">
            <th mat-header-cell *matHeaderCellDef>Bureau</th>
            <td mat-cell *matCellDef="let row">Box {{ row.boxNumber }}</td>
          </ng-container>
          <ng-container matColumnDef="actif">
            <th mat-header-cell *matHeaderCellDef>Statut</th>
            <td mat-cell *matCellDef="let row">
              <span [style.background]="row.actif ? '#43A047' : '#E53935'"
                    style="color:white;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:600;">
                {{ row.actif ? 'Actif' : 'Inactif' }}
              </span>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let r; columns: cols;"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [`.section-title{display:flex;align-items:center;gap:8px;margin-bottom:24px;font-size:22px;}`]
})
export class MedecinsComponent {
  cols = ['no', 'nom', 'specialite', 'service', 'boxNumber', 'actif'];
  medecins: Medecin[] = [
    { nom: 'Dr. Bennaoum Nour', specialite: 'Médecine générale', service: 'malade externe', boxNumber: 1, actif: true },
    { nom: 'Dr. Mesdour R', specialite: 'Médecine interne', service: 'malade externe', boxNumber: 2, actif: true },
    { nom: 'Dr. Khelili M', specialite: 'Cardiologie', service: 'Cardiologie', boxNumber: 3, actif: true },
    { nom: 'Dr. Boussaid F', specialite: 'Gynécologie', service: 'Gynécologie', boxNumber: 4, actif: false },
    { nom: 'Dr. Chouchan M', specialite: 'Néphrologie', service: 'Hémodialyse', boxNumber: 5, actif: true },
  ];
}
