<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Design Decision: This migration is intentionally a no-op.
 *
 * The `radio_demande` table already includes `radiology_exam_type_id` as a direct
 * foreign key (one row per exam type requested). A separate pivot table
 * (`radio_demande_items`) is therefore unnecessary — each radiology request row
 * already represents a single exam type. This keeps the schema simpler and avoids
 * an extra join for the most common query patterns.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // No-op: radio_demande already has radiology_exam_type_id as a direct FK.
        // One radio_demande row = one exam type requested.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op
    }
};
