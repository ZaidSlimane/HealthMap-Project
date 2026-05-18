<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Modules\Auth\Models\User;
use App\Modules\Auth\Models\Role;
use App\Modules\ClinicalCore\Models\Borne;

class TestDoctorSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create a test doctor
        $doctor = User::firstOrCreate(
            ['username' => 'a.benali'],
            [
                'name' => 'BENALI',
                'first_name' => 'Ahmed',
                'password' => Hash::make('password123'),
                'email' => 'a.benali@healthmap.dz',
                'is_active' => true,
                'is_consultant' => true,
                'establishment_id' => 1,
                'service_id' => 3,
            ]
        );

        // Assign Doctor role
        $doctorRole = Role::where('role', 'Doctor')->first();
        if (!$doctor->roles()->where('role_id', $doctorRole->id)->exists()) {
            $doctor->roles()->attach($doctorRole->id);
        }

        // Link to MEDECINE INTERNE via service_user pivot
        DB::table('service_user')->updateOrInsert(
            ['user_id' => $doctor->id, 'service_id' => 3],
            ['is_chef' => false, 'created_at' => now(), 'updated_at' => now()]
        );

        $this->command->info("Created doctor: BENALI Ahmed (ID: {$doctor->id}, username: a.benali, password: password123)");

        // 2. Create 2 consultation boxes in MEDECINE INTERNE
        $box1 = Borne::create([
            'name' => 'Box 1 Med Interne',
            'label_fr' => 'Box Consultation 1',
            'location' => 'Aile A - RDC',
            'status' => 'active',
            'type' => 'consultation',
            'is_active' => true,
            'service_id' => 3,
            'establishment_id' => 1,
        ]);

        $box2 = Borne::create([
            'name' => 'Box 2 Med Interne',
            'label_fr' => 'Box Consultation 2',
            'location' => 'Aile A - RDC',
            'status' => 'active',
            'type' => 'consultation',
            'is_active' => true,
            'service_id' => 3,
            'establishment_id' => 1,
        ]);

        $this->command->info("Created Box 1: {$box1->label_fr} (ID: {$box1->id})");
        $this->command->info("Created Box 2: {$box2->label_fr} (ID: {$box2->id})");

        // 3. Assign the doctor to Box 1
        DB::table('doctor_shift_assignments')->insert([
            'user_id' => $doctor->id,
            'service_id' => 3,
            'borne_id' => $box1->id,
            'day_of_week' => json_encode(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']),
            'start_time' => '08:00',
            'end_time' => '16:00',
            'assigned_by' => 3,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->command->info("Assigned Dr. BENALI to Box 1 (Mon-Fri 08:00-16:00)");
    }
}
