<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('establishments', function (Blueprint $table) {
            $table->string('directeur', 180)->nullable()->after('email');
            $table->string('fax', 32)->nullable()->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('establishments', function (Blueprint $table) {
            $table->dropColumn(['directeur', 'fax']);
        });
    }
};
