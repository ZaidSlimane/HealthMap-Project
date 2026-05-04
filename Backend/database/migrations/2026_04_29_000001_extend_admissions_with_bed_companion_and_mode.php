<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bring the `admissions` table up to the actual clinical flow:
 *
 *   patient ──admission──▶ service ─unit─▶ room ─bed
 *                  │
 *                  └── optional companion (garde-malade)
 *
 * The frontend has always tracked these fields client-side
 * (litId, gardeMalade, mode); persisting them lets the bed
 * occupancy on the dashboard become truthful and lets a
 * companion be tied to the stay it belongs to.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admissions', function (Blueprint $table) {
            // Bed assignment for the admission. Nullable so a request can
            // be created before a bed is allocated (PENDING workflow), and
            // nullOnDelete so deleting a bed doesn't cascade-destroy clinical
            // history.
            $table->foreignId('bed_id')
                ->nullable()
                ->after('service_id')
                ->constrained('beds')
                ->nullOnDelete();

            // Optional companion (garde-malade). Same nullOnDelete rationale.
            $table->foreignId('companion_id')
                ->nullable()
                ->after('bed_id')
                ->constrained('companions')
                ->nullOnDelete();

            // Admission mode: normale | urgence | programmee.
            // Stored as a short string + index instead of an enum so we can
            // extend the vocabulary without a destructive migration.
            $table->string('mode', 20)
                ->default('normale')
                ->after('motif_admission');

            $table->index('mode');
        });
    }

    public function down(): void
    {
        Schema::table('admissions', function (Blueprint $table) {
            $table->dropForeign(['bed_id']);
            $table->dropForeign(['companion_id']);
            $table->dropIndex(['mode']);
            $table->dropColumn(['bed_id', 'companion_id', 'mode']);
        });
    }
};
