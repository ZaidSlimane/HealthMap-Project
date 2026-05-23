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
        Schema::create('radio_resultat', function (Blueprint $table) {
            $table->id();
            $table->foreignId('radio_demande_id')->constrained('radio_demande')->cascadeOnDelete();
            $table->string('file_path')->nullable();
            $table->timestamp('file_uploaded_at')->nullable();
            $table->text('compte_rendu')->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('pending');
            $table->timestamps();

            $table->index('radio_demande_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('radio_resultat');
    }
};
