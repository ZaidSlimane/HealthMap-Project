<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Extend service_user pivot with is_chef flag
        Schema::table('service_user', function (Blueprint $table) {
            $table->boolean('is_chef')->default(false)->after('service_id');
        });

        // 2. Extend bornes table
        Schema::table('bornes', function (Blueprint $table) {
            $table->string('label_fr')->nullable()->after('name');
            $table->string('type', 20)->default('consultation')->after('label_fr');
            $table->boolean('is_active')->default(true)->after('type');
            $table->foreignId('service_id')->nullable()->after('is_active')
                ->constrained('services')->nullOnDelete();
        });

        // 3. Create doctor_shift_assignments table
        Schema::create('doctor_shift_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            $table->foreignId('borne_id')->constrained('bornes')->cascadeOnDelete();
            $table->json('day_of_week');
            $table->time('start_time');
            $table->time('end_time');
            $table->foreignId('assigned_by')->constrained('users')->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['service_id', 'borne_id']);
            $table->index(['user_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('doctor_shift_assignments');

        Schema::table('bornes', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
            $table->dropColumn(['label_fr', 'type', 'is_active', 'service_id']);
        });

        Schema::table('service_user', function (Blueprint $table) {
            $table->dropColumn('is_chef');
        });
    }
};
