<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Modules\ClinicalCore\Models\Service;

class RadiologieCentraleSeeder extends Seeder
{
    public function run(): void
    {
        if (!Service::where('name', 'Radiologie Centrale')->exists()) {
            Service::create([
                'name' => 'Radiologie Centrale',
                'code' => 'RADIO-CENTRAL',
                'service_type_id' => 6, // IMAGERIE
                'establishment_id' => 1,
                'is_active' => true,
            ]);
        }
    }
}
