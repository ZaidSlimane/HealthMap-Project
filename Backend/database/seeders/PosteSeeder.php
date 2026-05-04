<?php

namespace Database\Seeders;

use App\Modules\ClinicalCore\Models\Poste;
use Illuminate\Database\Seeder;

class PosteSeeder extends Seeder
{
    public function run(): void
    {
        // Canonical starter list. Admins can extend / edit from Tab 2 (Grades).
        $rows = [
            ['label' => 'Médecin',             'label_ar' => 'طبيب'],
            ['label' => 'Infirmier',           'label_ar' => 'ممرض'],
            ['label' => 'Sage-femme',          'label_ar' => 'قابلة'],
            ['label' => 'Aide-soignant',       'label_ar' => 'مساعد تمريض'],
            ['label' => 'Technicien labo',     'label_ar' => 'تقني مخبر'],
            ['label' => 'Manipulateur radio',  'label_ar' => 'تقني أشعة'],
            ['label' => 'Pharmacien',          'label_ar' => 'صيدلي'],
            ['label' => 'Administratif',       'label_ar' => 'إداري'],
        ];

        foreach ($rows as $row) {
            Poste::updateOrCreate(['label' => $row['label']], $row);
        }
    }
}
