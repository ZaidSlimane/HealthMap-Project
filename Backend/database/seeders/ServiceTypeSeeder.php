<?php

namespace Database\Seeders;

use App\Modules\ClinicalCore\Models\ServiceType;
use Illuminate\Database\Seeder;

/**
 * Seeds the global `service_types` reference list. These categorize each
 * Service (URGENCE, CHIRURGIE, ...). Idempotent.
 */
class ServiceTypeSeeder extends Seeder
{
    public function run(): void
    {
        $labels = [
            'URGENCE',
            'CHIRURGIE',
            'MEDECINE',
            'CONSULTATION',
            'LABORATOIRE',
            'IMAGERIE',
            'PHARMACIE',
            'ADMINISTRATION',
            'LOGISTIQUE',
            'ENSEIGNEMENT',
        ];

        foreach ($labels as $label) {
            ServiceType::firstOrCreate(['label' => $label]);
        }
    }
}
