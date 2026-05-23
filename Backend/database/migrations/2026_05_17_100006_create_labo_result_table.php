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
        Schema::create('labo_result', function (Blueprint $table) {
            $table->id();
            $table->foreignId('labo_demande_id')->constrained('labo_demande')->cascadeOnDelete();
            $table->foreignId('labo_demande_item_id')->nullable()->constrained('labo_demande_item')->cascadeOnDelete();
            $table->string('sub_analysis_name');
            $table->decimal('numeric_value', 10, 4)->nullable();
            $table->string('text_value')->nullable();
            $table->string('unit', 50)->nullable();
            $table->string('reference_range')->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('labo_demande_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('labo_result');
    }
};
