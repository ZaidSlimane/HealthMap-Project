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
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('patient_matricule')->unique()->nullable();
            $table->string('nin');
            $table->string('name')->nullable();
            $table->string('first_name')->nullable();
            $table->string('first_name_ar')->nullable();
            $table->string('name_ar')->nullable();
            $table->string('gender')->nullable();
            $table->dateTime('date_of_birth')->nullable();
            $table->foreignId('birth_place_id')->nullable()->constrained('municipalities');
            $table->string('father_first_name')->nullable();
            $table->string('mother_name')->nullable();
            $table->string('mother_first_name')->nullable();
            $table->string('father_first_name_ar')->nullable();
            $table->string('mother_name_ar')->nullable();
            $table->string('mother_first_name_ar')->nullable();
            $table->foreignId('nationality_id')->nullable()->constrained('countries');
            $table->foreignId('marital_status_id')->constrained('marital_statuses');
            $table->foreignId('spouse_id')->nullable()->constrained('patients');
            $table->string('ins');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
