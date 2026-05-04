<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Single-tenant for now: each user belongs to one establishment.
            // (We can swap this for a pivot when we go multi-tenant.)
            $table->foreignId('establishment_id')
                ->nullable()
                ->after('is_consultant')
                ->constrained('establishments')
                ->nullOnDelete();

            // First-login force password change (admin-provisioned accounts).
            $table->boolean('must_change_password')->default(true)->after('establishment_id');
            $table->timestamp('password_changed_at')->nullable()->after('must_change_password');

            // Onboarding gate. NULL = wizard not finished.
            $table->timestamp('onboarding_completed_at')->nullable()->after('password_changed_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['establishment_id']);
            $table->dropColumn([
                'establishment_id',
                'must_change_password',
                'password_changed_at',
                'onboarding_completed_at',
            ]);
        });
    }
};
