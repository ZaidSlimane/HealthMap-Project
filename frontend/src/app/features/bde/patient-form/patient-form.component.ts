import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { PatientStore } from '../data/patient-store';
import { Patient, Genre, SituationFamiliale } from '../models/patient.model';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-form.component.html',
  styleUrl: './patient-form.component.scss',
})
export class PatientFormComponent {
  private store = inject(PatientStore);
  private router = inject(Router);

  // Etat civil
  nomFr = ''; prenomFr = ''; nomAr = ''; prenomAr = '';
  nin = '';
  genre: Genre = 'M';
  dateNaissance = '';
  lieuNaissance = '';
  groupeSanguin = '';
  situation: SituationFamiliale | '' = '';
  profession = '';
  nationalite = 'Algérienne';
  pereNom = ''; pereNomAr = '';
  mereNom = ''; mereNomAr = '';
  mereNomFille = ''; mereNomFilleAr = '';
  // Coordonnées
  telephone = ''; email = '';
  rue = ''; ville = 'Constantine'; wilaya = 'Constantine'; codePostal = '';
  // Pièce
  pieceType: 'CIN' | 'Passeport' | 'Permis' | 'Acte de naissance' | 'Autre' = 'CIN';
  pieceNumero = '';
  // Optional sections
  showAccompagnant = signal(false);
  showUrgence = signal(false);
  // Accompagnant
  accNom = ''; accPrenom = ''; accLien = ''; accTel = '';
  // Urgence
  urgNom = ''; urgPrenom = ''; urgLien = ''; urgTel = ''; urgAdr = '';
  // Submit state
  submitting = signal(false);
  errorMsg = signal<string | null>(null);

  toggleAcc(): void { this.showAccompagnant.update(v => !v); }
  toggleUrg(): void { this.showUrgence.update(v => !v); }

  // Mock NIN registry (in lieu of a real national lookup)
  private static readonly NIN_REGISTRY: Record<string, Partial<PatientFormComponent>> = {
    '198503150025001234': {
      nomFr: 'Benali', prenomFr: 'Karim', nomAr: 'بن علي', prenomAr: 'كريم',
      genre: 'M', dateNaissance: '1985-03-15', lieuNaissance: 'Constantine',
      pereNom: 'Mohamed', pereNomAr: 'محمد',
      mereNom: 'Aïcha', mereNomAr: 'عائشة',
      mereNomFille: 'Saidi', mereNomFilleAr: 'السعيدي',
      nationalite: 'Algérienne',
    },
    '199207220025002345': {
      nomFr: 'Meziani', prenomFr: 'Fatima', genre: 'F', dateNaissance: '1992-07-22',
      lieuNaissance: 'Constantine',
      pereNom: 'Salah', pereNomAr: 'صالح',
      mereNom: 'Yamina', mereNomAr: 'يمينة',
      mereNomFille: 'Boumaza', mereNomFilleAr: 'بومعزة',
      nationalite: 'Algérienne',
    },
  };

  ninLookupMessage = signal<{ kind: 'ok'|'none'|'err'; text: string } | null>(null);

  // For NINs not in the seeded registry, deterministically synthesize a plausible
  // identity record (mock national-registry behavior). Real implementations would
  // call an external service; this keeps the demo fully offline and reproducible.
  private static synthesizeFromNin(nin: string): Partial<PatientFormComponent> {
    const NOMS = ['Bouhadi','Khelifi','Zemmouri','Lounis','Belkacem','Ait Ahmed','Saadi','Hamidi','Cherif','Bennacer'];
    const PRENOMS_M = ['Yacine','Riad','Sofiane','Amine','Walid','Mehdi','Adel','Khaled','Toufik','Bilal'];
    const PRENOMS_F = ['Lina','Sara','Amina','Nadia','Yasmine','Selma','Soraya','Nesrine','Houda','Imène'];
    const VILLES = ['Constantine','Annaba','Skikda','Mila','Jijel','Guelma','Sétif','Batna'];
    let h = 0; for (const c of nin) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const isMale = (h & 1) === 0;
    const nomFr = NOMS[h % NOMS.length];
    const prenomFr = (isMale ? PRENOMS_M : PRENOMS_F)[(h >>> 3) % PRENOMS_M.length];
    const lieu = VILLES[(h >>> 5) % VILLES.length];
    // Date of birth: deterministic year 1955–2005, month 1–12, day 1–28
    const year = 1955 + ((h >>> 7) % 50);
    const month = String(1 + ((h >>> 11) % 12)).padStart(2, '0');
    const day = String(1 + ((h >>> 13) % 28)).padStart(2, '0');
    return {
      nomFr, prenomFr,
      genre: isMale ? 'M' : 'F',
      dateNaissance: `${year}-${month}-${day}`,
      lieuNaissance: lieu,
      pereNom: PRENOMS_M[(h >>> 17) % PRENOMS_M.length],
      mereNom: PRENOMS_F[(h >>> 23) % PRENOMS_F.length],
      mereNomFille: NOMS[(h >>> 19) % NOMS.length],
      nationalite: 'Algérienne',
    };
  }

  rechercherNin(): void {
    const key = (this.nin || '').replace(/\s/g, '');
    if (!key) { this.ninLookupMessage.set({ kind: 'err', text: 'Saisissez un NIN à 18 chiffres pour lancer la recherche.' }); return; }
    if (!/^\d{18}$/.test(key)) { this.ninLookupMessage.set({ kind: 'err', text: 'Le NIN doit contenir exactement 18 chiffres.' }); return; }
    const hit = PatientFormComponent.NIN_REGISTRY[key] ?? PatientFormComponent.synthesizeFromNin(key);
    Object.assign(this, hit);
    this.ninLookupMessage.set({ kind: 'ok', text: `Fiche trouvée : ${hit.nomFr} ${hit.prenomFr} — champs préremplis depuis le registre national.` });
  }

  cancel(): void { this.router.navigate(['/bde/dashboard']); }

  submit(): void {
    this.errorMsg.set(null);
    if (!this.nomFr.trim() || !this.prenomFr.trim() || !this.dateNaissance) {
      this.errorMsg.set('Nom, prénom et date de naissance sont requis.');
      return;
    }
    if (this.nin && !/^\d{18}$/.test(this.nin.replace(/\s/g, ''))) {
      this.errorMsg.set('Le NIN doit contenir exactement 18 chiffres.');
      return;
    }
    if (this.showAccompagnant() && (!this.accNom.trim() || !this.accTel.trim())) {
      this.errorMsg.set("Accompagnant : le nom et le téléphone sont requis (ou repliez la section).");
      return;
    }
    if (this.showUrgence() && (!this.urgNom.trim() || !this.urgTel.trim())) {
      this.errorMsg.set("Contact d'urgence : le nom et le téléphone sont requis (ou repliez la section).");
      return;
    }
    this.submitting.set(true);

    const input: Omit<Patient, 'id' | 'createdAt' | 'dossierId'> = {
      nomFr: this.nomFr.trim(),
      prenomFr: this.prenomFr.trim(),
      nomAr: this.nomAr.trim() || undefined,
      prenomAr: this.prenomAr.trim() || undefined,
      nin: this.nin.replace(/\s/g, '') || undefined,
      genre: this.genre,
      dateNaissance: this.dateNaissance,
      lieuNaissance: this.lieuNaissance.trim() || undefined,
      groupeSanguin: this.groupeSanguin || undefined,
      situationFamiliale: this.situation || undefined,
      profession: this.profession.trim() || undefined,
      nationalite: this.nationalite,
      pereNom: this.pereNom.trim() || undefined,
      pereNomAr: this.pereNomAr.trim() || undefined,
      mereNom: this.mereNom.trim() || undefined,
      mereNomAr: this.mereNomAr.trim() || undefined,
      mereNomFille: this.mereNomFille.trim() || undefined,
      mereNomFilleAr: this.mereNomFilleAr.trim() || undefined,
      telephone: this.telephone.trim() || undefined,
      email: this.email.trim() || undefined,
      adresse: {
        rue: this.rue.trim(),
        ville: this.ville.trim(),
        wilaya: this.wilaya.trim(),
        codePostal: this.codePostal.trim() || undefined,
      },
      piece: this.pieceNumero.trim()
        ? { type: this.pieceType, numero: this.pieceNumero.trim() }
        : undefined,
      accompagnant: this.showAccompagnant() && this.accNom.trim()
        ? { nom: this.accNom.trim(), prenom: this.accPrenom.trim(), lien: this.accLien.trim(), telephone: this.accTel.trim() }
        : undefined,
      contactUrgence: this.showUrgence() && this.urgNom.trim()
        ? { nom: this.urgNom.trim(), prenom: this.urgPrenom.trim(), lien: this.urgLien.trim(), telephone: this.urgTel.trim(), adresse: this.urgAdr.trim() || undefined }
        : undefined,
    };

    const created = this.store.add(input);
    this.submitting.set(false);
    // Auto-navigate to the newly created medical folder
    this.router.navigate(['/bde/dossier', created.patient.id]);
  }
}
