<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Track patient bed movements over time
        Schema::create('patient_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('admission_id')->constrained('admissions')->cascadeOnDelete();
            $table->foreignId('bed_id')->constrained('beds')->cascadeOnDelete();
            $table->timestamp('moved_at');
            $table->timestamp('left_at')->nullable();
            $table->string('reason', 100)->nullable();
            $table->timestamps();

            $table->index(['admission_id', 'bed_id']);
            $table->index(['patient_id', 'moved_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_movements');
    }
};
