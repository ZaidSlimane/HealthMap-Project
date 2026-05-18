<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('boxes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('label_fr');
            $table->string('type', 20)->default('consultation'); // consultation, observation, urgence
            $table->boolean('is_active')->default(true);
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            $table->foreignId('establishment_id')->nullable()->constrained('establishments')->nullOnDelete();
            $table->timestamps();

            $table->index('service_id');
        });

        // Update doctor_shift_assignments to reference boxes instead of bornes
        Schema::table('doctor_shift_assignments', function (Blueprint $table) {
            $table->foreignId('box_id')->nullable()->after('borne_id')
                ->constrained('boxes')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('doctor_shift_assignments', function (Blueprint $table) {
            $table->dropForeign(['box_id']);
            $table->dropColumn('box_id');
        });

        Schema::dropIfExists('boxes');
    }
};
