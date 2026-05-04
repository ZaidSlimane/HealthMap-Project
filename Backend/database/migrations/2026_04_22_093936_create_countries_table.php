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
        Schema::create('countries', function (Blueprint $table) {
            $table->id();
            $table->integer('code');
            $table->string('alpha2', 6);
            $table->string('alpha3', 9);
            $table->string('name_ar', 135);
            $table->string('name_fr', 135);
            $table->unique('alpha2');
            $table->unique('alpha3');
            $table->unique('code');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('countries');
    }
};
