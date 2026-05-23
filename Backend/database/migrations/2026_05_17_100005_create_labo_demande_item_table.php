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
        Schema::create('labo_demande_item', function (Blueprint $table) {
            $table->id();
            $table->foreignId('labo_demande_id')->constrained('labo_demande')->cascadeOnDelete();
            $table->string('item_type', 20);
            $table->unsignedBigInteger('item_id');
            $table->string('status', 20)->default('pending');
            $table->timestamps();

            $table->index('labo_demande_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('labo_demande_item');
    }
};
