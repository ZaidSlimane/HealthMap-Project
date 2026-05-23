<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('labo_demande', function (Blueprint $table) {
            $table->timestamp('date_recep')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('labo_demande', function (Blueprint $table) {
            $table->dropColumn('date_recep');
        });
    }
};
