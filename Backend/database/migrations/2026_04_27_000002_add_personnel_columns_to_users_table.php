<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Personnel-side fields (Tab 0).
            $table->foreignId('poste_id')
                ->nullable()
                ->after('first_name_ar')
                ->constrained('postes')
                ->nullOnDelete();

            $table->foreignId('service_id')
                ->nullable()
                ->after('poste_id')
                ->constrained('services')
                ->nullOnDelete();

            // Utilisateurs-side fields (Tab 1).
            // `username` is the real login handle; existing rows have NULL until
            // they're "promoted" to a user account from the Utilisateurs tab.
            $table->string('username', 60)
                ->nullable()
                ->unique()
                ->after('email');

            // Soft-disable a user without deleting their personnel row.
            $table->boolean('is_active')->default(true)->after('username');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['poste_id']);
            $table->dropForeign(['service_id']);
            $table->dropUnique(['username']);
            $table->dropColumn(['poste_id', 'service_id', 'username', 'is_active']);
        });
    }
};
