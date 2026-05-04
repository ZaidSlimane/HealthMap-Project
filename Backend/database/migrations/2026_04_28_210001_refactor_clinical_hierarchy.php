<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Refactor the clinical hierarchy to match the operational reality:
 *
 *     Service  →  EstablishmentUnit  →  Room  →  Bed
 *
 * Was previously the inverse (units owned services, beds were a flat list
 * under a service with no rooms). This migration:
 *
 *  - creates the `rooms` table
 *  - moves `beds` to belong to a room (instead of a service)
 *  - moves `establishment_units` to belong to a service (instead of a type)
 *  - adds `services.code` and `services.is_active`; drops the now-redundant
 *    `services.admission_type` (admission shape now lives on the unit)
 *  - adds `establishment_units.unit_type` (Admission Classique, Soins
 *    Intensifs, etc.)
 *
 * Everything below `services` is tenant-scoped (carries `establishment_id`)
 * and protected by `BelongsToEstablishment` global scope on the model.
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1) Drop bed → service link (will be replaced by bed → room).
        Schema::table('beds', function (Blueprint $t) {
            $t->dropForeign(['service_id']);
            $t->dropColumn('service_id');
        });

        // 2) Drop unit → establishment_type link (a redundant denorm; the
        //    real tenant key is `establishment_id`).
        Schema::table('establishment_units', function (Blueprint $t) {
            $t->dropForeign(['establishment_type_id']);
            $t->dropColumn('establishment_type_id');
        });

        // 3) Drop services.admission_type (semantically belongs to the unit
        //    now). Since this column was NOT NULL, the only safe path is a
        //    drop; existing dev data is wiped via migrate:fresh.
        Schema::table('services', function (Blueprint $t) {
            $t->dropColumn('admission_type');
        });

        // 4) Promote services to the top of the clinical tree: add a visible
        //    code and an active flag (defaults to active so existing rows
        //    don't disappear from the UI).
        Schema::table('services', function (Blueprint $t) {
            $t->string('code', 32)->nullable()->after('name');
            $t->boolean('is_active')->default(true)->after('code');
        });

        // 5) New rooms table: a room belongs to a unit and has many beds.
        Schema::create('rooms', function (Blueprint $t) {
            $t->id();
            $t->foreignId('establishment_unit_id')->constrained('establishment_units')->cascadeOnDelete();
            $t->foreignId('establishment_id')->constrained('establishments')->cascadeOnDelete();
            $t->string('name', 80);
            $t->string('type', 40)->nullable();   // free-form: Chambre, Box, Salle
            $t->unsignedSmallInteger('capacity')->default(0);
            $t->timestamps();

            $t->index('establishment_id');
            $t->index('establishment_unit_id');
        });

        // 6) Wire units → service and add the unit_type label.
        Schema::table('establishment_units', function (Blueprint $t) {
            $t->foreignId('service_id')->nullable()->after('id')->constrained('services')->cascadeOnDelete();
            $t->string('unit_type', 40)->nullable()->after('name');
        });

        // 7) Add bed → room link (nullable for dev safety; tighten later).
        Schema::table('beds', function (Blueprint $t) {
            $t->foreignId('room_id')->nullable()->after('id')->constrained('rooms')->cascadeOnDelete();
            $t->index('room_id');
        });
    }

    public function down(): void
    {
        Schema::table('beds', function (Blueprint $t) {
            $t->dropForeign(['room_id']);
            $t->dropIndex(['room_id']);
            $t->dropColumn('room_id');
            $t->foreignId('service_id')->nullable()->constrained('services')->cascadeOnDelete();
        });

        Schema::table('establishment_units', function (Blueprint $t) {
            $t->dropForeign(['service_id']);
            $t->dropColumn(['service_id', 'unit_type']);
            $t->foreignId('establishment_type_id')->nullable()->constrained('establishment_types');
        });

        Schema::dropIfExists('rooms');

        Schema::table('services', function (Blueprint $t) {
            $t->dropColumn(['code', 'is_active']);
            $t->integer('admission_type')->default(1);
        });
    }
};
