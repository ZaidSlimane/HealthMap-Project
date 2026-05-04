<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Multi-tenancy: stamp every operational table with `establishment_id` so
 * data created within an establishment can never leak to another.
 *
 * Reference data (countries, provinces, municipalities, identity_documents,
 * marital_statuses, establishment_types, service_types, roles, permissions,
 * postes) is intentionally NOT scoped.
 */
return new class extends Migration
{
    /** @var array<int, string> */
    private array $tables = [
        'establishment_units',
        'services',
        'beds',
        'bornes',
        'patients',
        'companions',
        'admissions',
        'waiting_lists',
        'consultations',
        'consultation_symptoms',
        'prescriptions',
        'prescription_medications',
        'medical_documents',
        'observations',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->foreignId('establishment_id')
                    ->nullable()
                    ->constrained('establishments')
                    ->cascadeOnDelete();

                $t->index('establishment_id');
            });
        }
    }

    public function down(): void
    {
        foreach (array_reverse($this->tables) as $table) {
            Schema::table($table, function (Blueprint $t) use ($table) {
                $t->dropForeign(["{$table}_establishment_id_foreign"]);
                $t->dropIndex(["{$table}_establishment_id_index"]);
                $t->dropColumn('establishment_id');
            });
        }
    }
};
