<?php

namespace Database\Seeders;

use App\Modules\ClinicalCore\Models\Province;
use Illuminate\Database\Seeder;

class WilayaSeeder extends Seeder
{
    public function run(): void
    {
        $rows = json_decode(
            file_get_contents(database_path('data/wilayas.json')),
            true
        );

        foreach ($rows as $row) {
            Province::updateOrCreate(
                ['code' => $row['code']],
                ['name' => $row['name']]
            );
        }
    }
}
