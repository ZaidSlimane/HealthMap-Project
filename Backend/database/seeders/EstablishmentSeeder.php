<?php

namespace Database\Seeders;

use App\Modules\ClinicalCore\Models\Establishment;
use App\Modules\ClinicalCore\Models\EstablishmentType;
use App\Modules\ClinicalCore\Models\Province;
use Illuminate\Database\Seeder;

class EstablishmentSeeder extends Seeder
{
    public function run(): void
    {
        $rows = json_decode(
            file_get_contents(database_path('data/establishments.json')),
            true
        );

        // Cache lookups so we don't issue N queries.
        $types = EstablishmentType::pluck('id', 'code');
        $provinces = Province::pluck('id', 'code');

        foreach ($rows as $row) {
            $typeId = $types[$row['type_code']] ?? null;
            $provinceId = $provinces[$row['wilaya_code']] ?? null;

            if (!$typeId || !$provinceId) {
                $this->command->warn("Skipping {$row['slug']}: unknown type or wilaya.");
                continue;
            }

            Establishment::updateOrCreate(
                ['slug' => $row['slug']],
                [
                    'name' => $row['name'],
                    'establishment_type_id' => $typeId,
                    'province_id' => $provinceId,
                    'source' => 'seeded',
                    'status' => 'active',
                ]
            );
        }
    }
}
