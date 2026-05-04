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
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('name', 135)->nullable();
            $table->foreignId('chief_id')->nullable()->constrained('users');
            $table->foreignId('medical_chief_id')->nullable()->constrained('users');
            $table->foreignId('service_type_id')->nullable()->constrained('service_types');
            $table->integer('admission_type');
            $table->foreignId('establishment_unit_id')->constrained('establishment_units');
            $table->integer('max_duration')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
