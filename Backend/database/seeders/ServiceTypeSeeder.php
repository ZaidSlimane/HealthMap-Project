<?php

namespace Database\Seeders;

use App\Modules\ClinicalCore\Models\ServiceType;
use Illuminate\Database\Seeder;

/**
 * Seeds the global `service_types` reference list.
 * Idempotent.
 */
class ServiceTypeSeeder extends Seeder
{
    public function run(): void
    {
        $labels = [
            'URGENCES MEDICO-CHIR.',
            'MEDECINE INTERNE',
            'MEDECINE INFANTILE',
            'GASTRO-ENTEROLOGIE',
            'CARDIOLOGIE',
            'DERMATOLOGIE',
            'NEUROLOGIE',
            'PSYCHIATRIE',
            'DIABETOLOGIE',
            'REANIMATION MEDICALE',
            'MALADIES RESPIRATOIRES',
            'RHUMATOLOGIE',
            'NEPHROLOGIE',
            'ENDOCRINOLOGIE',
            'MALADIES INFECTUEUSES',
            'MEDECINE NUCLEAIRE',
            'MEDECINE SPORTIVE',
            'MALADIES INFECTUEUSES A',
            'MALADIES INFECTUEUSES B',
            'MALADIES INFECTUEUSES C',
            'MEDECINE LEGALE & ISOL.',
            'NEONATALOGIE',
            'SERVICE DES BRULES',
            'ALLERGOLOGIE',
            'HEMODIALYSE',
            'ONCOLOGIE MEDICALE',
            'RADIOTHERAPIE',
            'HEMATOLOGIE',
            'REEDUCATION FONCTIONNELLE',
            'ACUPUNCTURE',
            'PEDO-PSYCHIATRIE',
            'MEDECINE DU TRAVAIL',
            'ANESTHESIE-REANIMATION',
            'URGENCES CHIRURGICALES',
            'CHIRURGIE CARDIAQUE',
            'GREFFE RENALE',
            'CHIRURGIE INFANTILE',
            'CHIRURGIE GENERALE',
            'ORTHOPEDIE-TRAUMATOLOGIE',
            'CHIRURGIE MAXILLO FACIALE',
            'UROLOGIE',
            'O.R.L.',
            'NEURO CHIRURGIE',
            'OPHTALMOLOGIE',
            'MATERNITE',
            'CHIRURGIE THORACIQUE',
            'GYNECOLOGIE OBSTETRIQUE',
            'CHIRURGIE PLASTIQUE',
            'SENOLOGIE',
            'CHIR. CARDIO-VASCULAIRE',
            'CHIRURGIE VASCULAIRE',
            'CHIRURGIE HEPATOBILAIRE',
            'LABORATOIRE TOXICOLOGIE',
            'LABORATOIRE PARASITOLOGIE',
            'LABORATOIRE MICROBIOLOGIE',
            'CENTRE TRANS. SANGUINE',
            'LABORATOIRE BIOCHIMIE',
            'LABO. ANATOMIE PATHOLOGIE',
            'LABORATOIRE HEMATHOLOGIE',
            'LABORATOIRE IMMUNOLOGIE',
            'LABORATOIRE HEMOBIOLOGIE',
            'LAB. HYDROBROMATOLOGIE',
            'NEURO RADIOLOGIE',
            'RADIOLOGIE CENTRALE',
            'DENTIS. OPERAT.& CONSERV.',
            'PATHOLOGIE BUCCO DENTAIRE',
            'O.D.F',
            'PROTHESE DENTAIRE',
            'PARO-ODONTO',
            'MAGASIN',
            'MAGASIN INSTRUMENTATION',
            'CHIRURGIE CARCINOLOGIQUE',
            'ONCOLOGIE PEDIATRIQUE',
            'ONCOLOGIE MEDICALE ADULTE',
            'CARDIOLOGIE A1',
            'CARDIOLOGIE A2',
            'CHIRURGIE GENERALE A',
            'CHIRURGIE GENERALE B',
            'CHIRURGIE ORTHOPEDIQUE TRAUMALOLOGIQUE A',
            'CHIRURGIE ORTHOPEDIQUE TRAUMALOLOGIQUE B',
            'CHIRURGIE THORACIQUE ET CARDIOVASCULAIRE',
            'HEPATOLOGIE',
            'HEMOBIOLOGIE ET BANQUE DE SANG',
            'MEDECINE PHYSIQUE ET READAPTATION',
            'NEPHROLOGIE-HEMODIALYSE',
            'OPHTALMOLOGIE A',
            'OPHTALMOLOGIE B',
            'PNEUMOLOGIE-PHTISIOLOGIE',
        ];

        foreach ($labels as $label) {
            ServiceType::firstOrCreate(['label' => $label]);
        }
    }
}
