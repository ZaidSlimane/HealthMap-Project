<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('establishments', function (Blueprint $table) {
            $table->id();
            // Slug is the public identifier (matches what the frontend sends as
            // `establishment_id`). Unique so we can resolve seeded rows by slug.
            $table->string('slug', 96)->unique();
            $table->string('name', 180);
            $table->string('name_ar', 180)->nullable();
            $table->foreignId('establishment_type_id')->constrained('establishment_types');
            $table->foreignId('province_id')->constrained('provinces');
            $table->foreignId('municipality_id')->nullable()->constrained('municipalities');
            $table->string('address', 255)->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('email', 180)->nullable();
            // 'seeded' = part of the shipped directory; 'custom' = created by
            // an admin during onboarding because their hospital wasn't listed.
            $table->enum('source', ['seeded', 'custom'])->default('seeded');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['province_id', 'establishment_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('establishments');
    }
};
