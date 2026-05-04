<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('provinces', function (Blueprint $table) {
            // Algerian wilaya code (1..58). Unique so we can resolve from the API
            // payload (`wilaya_code`) without a lookup table dance.
            $table->unsignedSmallInteger('code')->nullable()->unique()->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('provinces', function (Blueprint $table) {
            $table->dropUnique(['code']);
            $table->dropColumn('code');
        });
    }
};
