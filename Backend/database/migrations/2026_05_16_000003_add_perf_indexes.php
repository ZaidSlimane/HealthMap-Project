<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // users.username already has a unique index, but let's verify
        // and add an active+username composite index for the login query.
        $existing = collect(DB::select("SHOW INDEX FROM users"))->pluck('Key_name')->unique();

        if (!$existing->contains('users_username_is_active_index')) {
            Schema::table('users', function (Blueprint $table) {
                $table->index(['username', 'is_active'], 'users_username_is_active_index');
            });
        }

        // service_user lookup is critical for chef detection
        $existingSU = collect(DB::select("SHOW INDEX FROM service_user"))->pluck('Key_name')->unique();
        if (!$existingSU->contains('service_user_user_is_chef_index')) {
            Schema::table('service_user', function (Blueprint $table) {
                $table->index(['user_id', 'is_chef'], 'service_user_user_is_chef_index');
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_username_is_active_index');
        });
        Schema::table('service_user', function (Blueprint $table) {
            $table->dropIndex('service_user_user_is_chef_index');
        });
    }
};
