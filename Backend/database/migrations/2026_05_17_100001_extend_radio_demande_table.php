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
        Schema::create('radio_demande', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_id')->nullable()->constrained('consultations')->nullOnDelete();
            $table->foreignId('admission_id')->nullable()->constrained('admissions')->nullOnDelete();
            $table->foreignId('radiology_exam_type_id')->constrained('radiology_exam_types')->cascadeOnDelete();
            $table->string('urgency', 10)->default('normal');
            $table->string('status', 20)->default('pending');
            $table->text('notes')->nullable();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index('consultation_id');
            $table->index('status');
            $table->index('requested_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('radio_demande');
    }
};
