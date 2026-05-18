<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Clinical workflow schema changes:
 * 1. Waiting list — state machine columns
 * 2. Consultations — expand with clinical fields
 * 3. Triages — new table for triage/vitals data
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Waiting List: state machine ──────────────────────────────
        Schema::table('waiting_lists', function (Blueprint $table) {
            // Drop old generic status, replace with constrained one
            $table->dropColumn('status');
        });
        Schema::table('waiting_lists', function (Blueprint $table) {
            $table->string('status', 30)->default('waiting')->after('added_at');
            $table->timestamp('called_at')->nullable()->after('status');
            $table->timestamp('consultation_at')->nullable()->after('called_at');
            $table->unsignedSmallInteger('called_count')->default(0)->after('consultation_at');
            // Override priority from int to enum-like string
            $table->dropColumn('priority');
        });
        Schema::table('waiting_lists', function (Blueprint $table) {
            $table->string('priority', 10)->default('green')->after('service_id');
        });

        // ── 2. Consultations: expand schema ─────────────────────────────
        Schema::table('consultations', function (Blueprint $table) {
            $table->text('motif')->nullable()->after('notes');
            $table->text('anamnese')->nullable()->after('motif');
            $table->text('examen_clinique')->nullable()->after('anamnese');
            $table->text('compte_rendu')->nullable()->after('examen_clinique');
            $table->text('diagnostic')->nullable()->after('compte_rendu');
            $table->string('cim10_code', 10)->nullable()->after('diagnostic');
            $table->string('status', 20)->default('in_progress')->after('cim10_code');
            $table->foreignId('waiting_list_id')->nullable()->after('status')
                ->constrained('waiting_lists')->nullOnDelete();
            $table->timestamp('started_at')->nullable()->after('waiting_list_id');
            $table->timestamp('completed_at')->nullable()->after('started_at');
        });

        // ── 3. Triages: new table ───────────────────────────────────────
        Schema::create('triages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('waiting_list_id')->nullable()->constrained('waiting_lists')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete(); // triage nurse/doctor
            $table->foreignId('patient_id')->nullable()->constrained('patients')->nullOnDelete();
            $table->foreignId('establishment_id')->nullable()->constrained('establishments')->cascadeOnDelete();
            $table->decimal('temperature', 4, 1)->nullable();
            $table->unsignedSmallInteger('tension_sys')->nullable();
            $table->unsignedSmallInteger('tension_dia')->nullable();
            $table->unsignedSmallInteger('heart_rate')->nullable();
            $table->unsignedSmallInteger('spo2')->nullable();
            $table->unsignedSmallInteger('weight')->nullable();
            $table->unsignedSmallInteger('pain_score')->nullable();
            $table->string('urgency_level', 10)->default('green'); // red, orange, green
            $table->string('orientation', 60)->nullable(); // which service/box
            $table->json('symptoms')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('waiting_list_id');
            $table->index('establishment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('triages');

        Schema::table('consultations', function (Blueprint $table) {
            $table->dropForeign(['waiting_list_id']);
            $table->dropColumn([
                'motif', 'anamnese', 'examen_clinique', 'compte_rendu',
                'diagnostic', 'cim10_code', 'status', 'waiting_list_id',
                'started_at', 'completed_at',
            ]);
        });

        Schema::table('waiting_lists', function (Blueprint $table) {
            $table->dropColumn(['status', 'called_at', 'consultation_at', 'called_count', 'priority']);
        });
        Schema::table('waiting_lists', function (Blueprint $table) {
            $table->string('status')->default('waiting');
            $table->integer('priority')->default(0);
        });
    }
};
