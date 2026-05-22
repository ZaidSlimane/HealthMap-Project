<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Modules\Auth\Models\User;
use App\Modules\Auth\Models\Role;

class BdeUserSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['username' => 'bde'],
            [
                'name' => 'BUREAU',
                'first_name' => 'Entrées',
                'email' => 'bde@healthmap.dz',
                'password' => Hash::make('password123'),
                'is_active' => true,
                'is_consultant' => false,
                'establishment_id' => 1,
            ]
        );

        $bdeRole = Role::where('role', 'BDE')->first();
        if ($bdeRole && !$user->roles()->where('role_id', $bdeRole->id)->exists()) {
            $user->roles()->attach($bdeRole->id);
        }

        $this->command->info("BDE user created: username=bde, password=password123 (ID: {$user->id})");
    }
}
