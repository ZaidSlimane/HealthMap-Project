<?php

namespace Database\Seeders;

use App\Modules\ClinicalCore\Models\EstablishmentType;
use Illuminate\Database\Seeder;

class EstablishmentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $rows = json_decode(
            file_get_contents(database_path('data/establishment_types.json')),
            true
        );

        foreach ($rows as $row) {
            EstablishmentType::updateOrCreate(
                ['code' => $row['code']],
                ['label' => $row['label']]
            );
        }
    }
}
