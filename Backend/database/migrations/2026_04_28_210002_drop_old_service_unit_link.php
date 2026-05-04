<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The previous hierarchy had `services.establishment_unit_id` as the FK
 * from a service up to its parent unit. With the refactored hierarchy
 * (Service → Unit → Room → Bed), units now belong to services via
 * `establishment_units.service_id`, so the old column is dead weight
 * and (being NOT NULL) prevents creating top-level services. Drop it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $t) {
            $t->dropForeign(['establishment_unit_id']);
            $t->dropColumn('establishment_unit_id');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $t) {
            $t->foreignId('establishment_unit_id')->nullable()->constrained('establishment_units');
        });
    }
};
