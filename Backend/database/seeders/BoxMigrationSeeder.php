<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Modules\ChefService\Models\Box;

class BoxMigrationSeeder extends Seeder
{
    public function run(): void
    {
        // Create 2 boxes in MEDECINE INTERNE (service_id: 3)
        $box1 = Box::firstOrCreate(
            ['name' => 'Box 1 Med Interne', 'service_id' => 3],
            [
                'label_fr' => 'Box Consultation 1',
                'type' => 'consultation',
                'is_active' => true,
                'establishment_id' => 1,
            ]
        );

        $box2 = Box::firstOrCreate(
            ['name' => 'Box 2 Med Interne', 'service_id' => 3],
            [
                'label_fr' => 'Box Consultation 2',
                'type' => 'consultation',
                'is_active' => true,
                'establishment_id' => 1,
            ]
        );

        $this->command->info("Box 1: {$box1->label_fr} (ID: {$box1->id})");
        $this->command->info("Box 2: {$box2->label_fr} (ID: {$box2->id})");

        // Assign Dr. BENALI (ID: 4) to Box 1 using box_id
        DB::table('doctor_shift_assignments')
            ->where('user_id', 4)
            ->where('service_id', 3)
            ->update(['box_id' => $box1->id]);

        // If no assignment exists yet, create one
        if (!DB::table('doctor_shift_assignments')->where('user_id', 4)->where('box_id', $box1->id)->exists()) {
            DB::table('doctor_shift_assignments')->insert([
                'user_id' => 4,
                'service_id' => 3,
                'borne_id' => 1,
                'box_id' => $box1->id,
                'day_of_week' => json_encode(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']),
                'start_time' => '08:00',
                'end_time' => '16:00',
                'assigned_by' => 3,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info("Dr. BENALI assigned to Box 1 via box_id");
    }
}
