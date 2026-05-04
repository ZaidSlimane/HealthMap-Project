import {
  Component, Input, Output, EventEmitter, signal,
  ChangeDetectionStrategy, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdmissionMode } from '../../../../core/services/admission-request.service';

export interface AdmissionFormPayload {
  nom: string;
  prenom: string;
  mode: AdmissionMode;
  gardeMalade: boolean;
  motif: string;
}

export interface AdmissionFormContext {
  serviceNom: string;
  uniteNom: string;
  salleNom: string;
  litNumero: string;
}

@Component({
  selector: 'hm-admission-request-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open) {
      <div class="arf-backdrop" (click)="onCancel()"></div>
      <div class="arf-modal" role="dialog" aria-modal="true">
        <header class="arf-head">
          <span class="material-icons head-icon">edit_note</span>
          <h2>Ajouter une demande d'admission</h2>
          <button type="button" class="x-btn" (click)="onCancel()" aria-label="Fermer">
            <span class="material-icons">close</span>
          </button>
        </header>

        @if (context) {
          <div class="arf-context">
            <span class="ctx-tag">{{ context.serviceNom }}</span>
            <span class="ctx-sep">›</span>
            <span class="ctx-tag">{{ context.uniteNom }}</span>
            <span class="ctx-sep">›</span>
            <span class="ctx-tag">{{ context.salleNom }}</span>
            <span class="ctx-sep">›</span>
            <span class="ctx-tag ctx-bed"><span class="material-icons">bed</span>{{ context.litNumero }}</span>
          </div>
        }

        <form class="arf-form" (ngSubmit)="onSubmit()" #f="ngForm">
          <div class="grid-2">
            <div class="field">
              <label for="arf-nom">Nom</label>
              <input id="arf-nom" type="text" placeholder="Nom"
                [(ngModel)]="nom" name="nom" required autofocus />
            </div>
            <div class="field">
              <label for="arf-prenom">Prenom</label>
              <input id="arf-prenom" type="text" placeholder="Prenom"
                [(ngModel)]="prenom" name="prenom" required />
            </div>
          </div>

          <div class="grid-2">
            <div class="field">
              <label for="arf-mode">Mode d'admission</label>
              <select id="arf-mode" [(ngModel)]="mode" name="mode" required>
                <option value="Admission normale">Admission normale</option>
                <option value="Urgence">Urgence</option>
                <option value="Programmée">Programmée</option>
              </select>
            </div>
            <div class="field">
              <label>Nécessite un garde Malade</label>
              <div class="toggle-pair">
                <button type="button" class="toggle-btn yes"
                  [class.active]="gardeMalade"
                  (click)="gardeMalade = true">
                  <span class="material-icons">check</span> Oui
                </button>
                <button type="button" class="toggle-btn no"
                  [class.active]="!gardeMalade"
                  (click)="gardeMalade = false">
                  <span class="material-icons">close</span> Non
                </button>
              </div>
            </div>
          </div>

          <div class="field">
            <label for="arf-motif">Motif d'admission</label>
            <textarea id="arf-motif" rows="4"
              [(ngModel)]="motif" name="motif"></textarea>
          </div>

          <footer class="arf-actions">
            <button type="submit" class="btn-primary" [disabled]="!isValid()">
              <span class="material-icons">add</span> Ajouter
            </button>
            <button type="button" class="btn-ghost" (click)="onCancel()">Annuler</button>
          </footer>
        </form>
      </div>
    }
  `,
  styles: [`
    :host { font-family: var(--font-body, 'Plus Jakarta Sans', sans-serif); }

    .arf-backdrop {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(2px); z-index: 1000;
      animation: fadeIn .15s ease;
    }
    .arf-modal {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: min(720px, 92vw); max-height: 90vh; overflow: auto;
      background: #fff; border-radius: var(--radius-lg, 14px);
      box-shadow: 0 24px 60px rgba(0,0,0,0.25);
      z-index: 1001; animation: slideIn .2s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideIn { from { opacity: 0; transform: translate(-50%, -45%);} to { opacity: 1; transform: translate(-50%,-50%);} }

    .arf-head {
      display: flex; align-items: center; gap: 12px;
      padding: 18px 22px; border-bottom: 1px solid var(--color-border, rgba(0,0,0,0.08));
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    }
    .head-icon { color: var(--color-primary, #00BCD4); font-size: 26px; }
    .arf-head h2 { margin: 0; flex: 1; font-size: 18px; font-weight: 700; color: #0f172a;
      font-family: var(--font-heading, 'Plus Jakarta Sans', sans-serif); }
    .x-btn { background: transparent; border: 0; cursor: pointer; padding: 6px; border-radius: 8px;
      color: #64748b; transition: background .15s; }
    .x-btn:hover { background: rgba(0,0,0,0.05); color: #0f172a; }

    .arf-context {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
      padding: 12px 22px; background: var(--color-primary-light, #E0F7FA);
      font-size: 12.5px; color: var(--color-primary-dark, #0097A7); font-weight: 600;
    }
    .ctx-tag { display: inline-flex; align-items: center; gap: 4px; }
    .ctx-tag .material-icons { font-size: 16px; }
    .ctx-sep { opacity: .5; }
    .ctx-bed {
      background: #fff; padding: 3px 10px; border-radius: 999px;
      color: var(--color-primary-dark, #0097A7);
    }

    .arf-form { padding: 22px; display: flex; flex-direction: column; gap: 16px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }

    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 12.5px; font-weight: 700; color: #1e293b; letter-spacing: .01em; }
    .field input, .field select, .field textarea {
      width: 100%; padding: 10px 12px; border: 1px solid var(--color-border-strong, rgba(0,0,0,0.14));
      border-radius: var(--radius-md, 10px); font-size: 14px; font-family: inherit;
      background: #fff; color: #0f172a; transition: border-color .15s, box-shadow .15s;
    }
    .field input:focus, .field select:focus, .field textarea:focus {
      outline: none; border-color: var(--color-primary, #00BCD4);
      box-shadow: 0 0 0 3px var(--color-primary-glow, rgba(0,188,212,.18));
    }
    .field textarea { resize: vertical; min-height: 80px; font-family: inherit; }

    .toggle-pair { display: flex; gap: 0; border-radius: var(--radius-md, 10px);
      overflow: hidden; border: 1px solid var(--color-border-strong, rgba(0,0,0,0.14));
      width: max-content; }
    .toggle-btn {
      display: inline-flex; align-items: center; gap: 4px; padding: 9px 16px;
      background: #fff; border: 0; cursor: pointer; font-size: 13px; font-weight: 600;
      color: #64748b; transition: all .15s; font-family: inherit;
    }
    .toggle-btn .material-icons { font-size: 16px; }
    .toggle-btn + .toggle-btn { border-left: 1px solid var(--color-border-strong, rgba(0,0,0,0.14)); }
    .toggle-btn.yes.active { background: var(--color-primary, #00BCD4); color: #fff; }
    .toggle-btn.no.active { background: #475569; color: #fff; }

    .arf-actions {
      display: flex; gap: 10px; padding-top: 8px;
      border-top: 1px solid var(--color-border, rgba(0,0,0,0.08));
      margin-top: 8px; padding-top: 16px;
    }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--color-primary, #00BCD4); color: #fff; border: 0;
      padding: 10px 18px; border-radius: var(--radius-md, 10px); font-weight: 700;
      font-size: 13.5px; cursor: pointer; transition: background .15s; font-family: inherit;
    }
    .btn-primary:hover:not(:disabled) { background: var(--color-primary-dark, #0097A7); }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-primary .material-icons { font-size: 18px; }
    .btn-ghost {
      background: #f1f5f9; color: #475569; border: 0;
      padding: 10px 18px; border-radius: var(--radius-md, 10px); font-weight: 600;
      font-size: 13.5px; cursor: pointer; transition: background .15s; font-family: inherit;
    }
    .btn-ghost:hover { background: #e2e8f0; }
  `]
})
export class AdmissionRequestFormComponent implements OnChanges {
  @Input() open = false;
  @Input() context: AdmissionFormContext | null = null;
  @Input() defaultMedecin = '';

  @Output() submitted = new EventEmitter<AdmissionFormPayload>();
  @Output() cancelled = new EventEmitter<void>();

  nom = '';
  prenom = '';
  mode: AdmissionMode = 'Admission normale';
  gardeMalade = false;
  motif = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.nom = '';
      this.prenom = '';
      this.mode = 'Admission normale';
      this.gardeMalade = false;
      this.motif = '';
    }
  }

  isValid(): boolean {
    return this.nom.trim().length > 0 && this.prenom.trim().length > 0;
  }

  onSubmit(): void {
    if (!this.isValid()) return;
    this.submitted.emit({
      nom: this.nom.trim(),
      prenom: this.prenom.trim(),
      mode: this.mode,
      gardeMalade: this.gardeMalade,
      motif: this.motif.trim(),
    });
  }

  onCancel(): void { this.cancelled.emit(); }
}
