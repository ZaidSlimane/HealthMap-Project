<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Modules\ClinicalCore\Models\Patient;

class TestQueueSeeder extends Seeder
{
    public function run(): void
    {
        // Create a test patient if it doesn't exist
        $maritalStatusId = DB::table('marital_statuses')->value('id') ?? 1;

        $patient = Patient::firstOrCreate(
            ['nin' => '123456789012345678'],
            [
                'patient_matricule' => 'P-TEST-001',
                'name' => 'BENMOHAMED',
                'first_name' => 'Karim',
                'name_ar' => 'بن محمد',
                'first_name_ar' => 'كريم',
                'gender' => 'M',
                'date_of_birth' => '1985-03-15',
                'father_first_name' => 'Mohamed',
                'mother_name' => 'BENALI',
                'mother_first_name' => 'Fatima',
                'marital_status_id' => $maritalStatusId,
                'ins' => 'INS-TEST-001',
                'establishment_id' => 1,
            ]
        );

        $this->command->info("Patient: {$patient->name} {$patient->first_name} (ID: {$patient->id})");

        // Add to waiting list for MEDECINE INTERNE service, Box 1
        $now = now();
        $exists = DB::table('waiting_lists')
            ->where('patient_id', $patient->id)
            ->where('service_id', 3)
            ->where('status', 'waiting')
            ->exists();

        if (!$exists) {
            DB::table('waiting_lists')->insert([
                'patient_id' => $patient->id,
                'service_id' => 3,
                'box_id' => 1,
                'priority' => 'red',
                'status' => 'waiting',
                'added_at' => $now,
                'establishment_id' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $this->command->info('Added Karim BENMOHAMED to Box 1 waiting list (priority: red/urgent)');
        } else {
            $this->command->info('Patient already in waiting list.');
        }
    }
}
