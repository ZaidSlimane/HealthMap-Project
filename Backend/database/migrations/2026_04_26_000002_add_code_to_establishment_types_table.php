<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('establishment_types', function (Blueprint $table) {
            // Stable string code the frontend sends (e.g. "CHU", "EPH").
            $table->string('code', 32)->nullable()->unique()->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('establishment_types', function (Blueprint $table) {
            $table->dropUnique(['code']);
            $table->dropColumn('code');
        });
    }
};
