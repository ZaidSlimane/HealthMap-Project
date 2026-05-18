<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ConsultationDictionarySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Categories (specialties)
        $categories = [
            ['label' => 'Cardiologie', 'code' => 'cardio', 'icon' => 'favorite', 'sort_order' => 1],
            ['label' => 'Endocrinologie', 'code' => 'endo', 'icon' => 'water_drop', 'sort_order' => 2],
            ['label' => 'Pneumologie', 'code' => 'pneumo', 'icon' => 'air', 'sort_order' => 3],
            ['label' => 'Gastro-entérologie', 'code' => 'gastro', 'icon' => 'restaurant', 'sort_order' => 4],
            ['label' => 'Neurologie', 'code' => 'neuro', 'icon' => 'psychology', 'sort_order' => 5],
            ['label' => 'Urologie', 'code' => 'uro', 'icon' => 'water', 'sort_order' => 6],
            ['label' => 'Gynécologie', 'code' => 'gyneco', 'icon' => 'female', 'sort_order' => 7],
        ];

        foreach ($categories as $cat) {
            DB::table('consultation_categories')->updateOrInsert(
                ['code' => $cat['code']],
                array_merge($cat, ['created_at' => $now, 'updated_at' => $now])
            );
        }

        // Sub-categories (the 10 sections of a consultation)
        $subCategories = [
            'Signes généraux', 'Mesures', 'Facteurs de risque',
            'Antécédents pathologiques', 'Signes fonctionnels',
            'Signes physiques', 'Syndromes', 'Examens', 'Images',
            'Examens complémentaires',
        ];

        foreach ($subCategories as $i => $label) {
            DB::table('consultation_sub_categories')->updateOrInsert(
                ['label' => $label, 'category_id' => null],
                ['sort_order' => $i + 1, 'created_at' => $now, 'updated_at' => $now]
            );
        }

        // Sample elements for Pneumologie — Signes fonctionnels
        $signesFonctionnels = DB::table('consultation_sub_categories')->where('label', 'Signes fonctionnels')->value('id');
        $signesPhysiques = DB::table('consultation_sub_categories')->where('label', 'Signes physiques')->value('id');

        if ($signesFonctionnels) {
            $fonctionnels = [
                ['label_positive' => 'Toux', 'label_negative' => 'Pas de toux', 'type' => 'symptom'],
                ['label_positive' => 'Expectorations', 'label_negative' => 'Pas d\'expectorations', 'type' => 'symptom'],
                ['label_positive' => 'Hémoptysie', 'label_negative' => 'Pas d\'hémoptysie', 'type' => 'symptom'],
                ['label_positive' => 'Douleur Thoracique', 'label_negative' => 'Pas de douleur thoracique', 'type' => 'symptom'],
                ['label_positive' => 'Dyspnée', 'label_negative' => 'Pas de dyspnée', 'type' => 'symptom'],
            ];
            foreach ($fonctionnels as $i => $el) {
                DB::table('consultation_elements')->updateOrInsert(
                    ['sub_category_id' => $signesFonctionnels, 'label_positive' => $el['label_positive']],
                    array_merge($el, ['sort_order' => $i + 1, 'created_at' => $now, 'updated_at' => $now])
                );
            }
        }

        if ($signesPhysiques) {
            $physiques = [
                'Cyanose', 'Hypocratisme digital', 'Déformation thoracique',
                'Vibrations vocales diminuées', 'Vibrations vocales augmentées', 'Matité',
                'Tympanisme', 'Râles crépitants', 'Râles sous-crépitants',
                'Râles sibilants', 'Râles ronflants', 'Murmure vésiculaire diminué',
                'Murmure vésiculaire aboli',
            ];
            foreach ($physiques as $i => $label) {
                DB::table('consultation_elements')->updateOrInsert(
                    ['sub_category_id' => $signesPhysiques, 'label_positive' => $label],
                    [
                        'label_negative' => 'Pas de ' . strtolower($label),
                        'type' => 'symptom',
                        'sort_order' => $i + 1,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }
        }

        $this->command->info('Consultation dictionary seeded (categories, sub-categories, elements).');
    }
}
