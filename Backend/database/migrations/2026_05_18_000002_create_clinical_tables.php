<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Insurance ────────────────────────────────────────────────────

        Schema::create('insurance_companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('patient_insurances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_id')->constrained('admissions')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('insurance_company_id')->nullable()->constrained('insurance_companies')->nullOnDelete();
            $table->string('numero_ss')->nullable();
            $table->string('matricule_carte')->nullable();
            $table->string('nom_assure')->nullable();
            $table->string('prenom_assure')->nullable();
            $table->date('date_naissance_assure')->nullable();
            $table->string('employeur')->nullable();
            $table->string('status', 30)->default('active');
            $table->timestamps();

            $table->index('admission_id');
            $table->index('patient_id');
        });

        // ── Discharge ────────────────────────────────────────────────────

        Schema::create('discharge_modes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('label');
            $table->timestamps();
        });

        Schema::create('discharges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_id')->constrained('admissions')->cascadeOnDelete();
            $table->foreignId('discharge_mode_id')->nullable()->constrained('discharge_modes')->nullOnDelete();
            $table->timestamp('date_medical')->nullable();
            $table->timestamp('date_administrative')->nullable();
            $table->foreignId('doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('diagnostic_sortie')->nullable();
            $table->timestamps();

            $table->index('admission_id');
        });

        // ── Mortality ────────────────────────────────────────────────────

        Schema::create('deaths', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_id')->constrained('admissions')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->timestamp('date_deces');
            $table->text('cause')->nullable();
            $table->foreignId('declared_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('admission_id');
            $table->index('patient_id');
        });

        // ── Procedures / Acts ────────────────────────────────────────────

        Schema::create('procedure_catalog', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->nullable();
            $table->string('label');
            $table->string('category', 50)->nullable();
            $table->decimal('cost', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('performed_procedures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_id')->constrained('admissions')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('procedure_id')->nullable()->constrained('procedure_catalog')->nullOnDelete();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('label')->nullable();
            $table->text('details')->nullable();
            $table->decimal('cost', 10, 2)->nullable();
            $table->boolean('is_external')->default(false);
            $table->timestamp('performed_at');
            $table->timestamps();

            $table->index('admission_id');
            $table->index('patient_id');
        });

        Schema::create('surgical_procedures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_id')->constrained('admissions')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('label');
            $table->text('details')->nullable();
            $table->timestamp('performed_at');
            $table->timestamps();

            $table->index('admission_id');
        });

        // ── Diagnoses / ICD ──────────────────────────────────────────────

        Schema::create('diagnosis_catalog', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->nullable()->index();
            $table->string('label');
            $table->text('description')->nullable();
            $table->string('chapter', 100)->nullable();
            $table->timestamps();
        });

        Schema::create('patient_diagnoses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_id')->nullable()->constrained('admissions')->cascadeOnDelete();
            $table->foreignId('consultation_id')->nullable()->constrained('consultations')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('diagnosis_id')->nullable()->constrained('diagnosis_catalog')->nullOnDelete();
            $table->foreignId('diagnosed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 30)->nullable();
            $table->timestamp('diagnosed_at');
            $table->timestamps();

            $table->index('admission_id');
            $table->index('consultation_id');
            $table->index('patient_id');
        });

        // ── Antecedents / History ────────────────────────────────────────

        Schema::create('patient_antecedents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('content');
            $table->string('type', 50)->nullable();
            $table->timestamps();

            $table->index('patient_id');
        });

        Schema::create('patient_social_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('content');
            $table->timestamps();

            $table->index('patient_id');
        });

        // ── Vital Signs ──────────────────────────────────────────────────

        Schema::create('vital_sign_types', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->string('unit', 30)->nullable();
            $table->string('icon', 50)->nullable();
            $table->string('color', 30)->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('vital_signs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vital_sign_type_id')->constrained('vital_sign_types')->cascadeOnDelete();
            $table->foreignId('admission_id')->constrained('admissions')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->decimal('value', 8, 2);
            $table->timestamp('measured_at');
            $table->foreignId('measured_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['admission_id', 'vital_sign_type_id']);
            $table->index(['patient_id', 'measured_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vital_signs');
        Schema::dropIfExists('vital_sign_types');
        Schema::dropIfExists('patient_social_history');
        Schema::dropIfExists('patient_antecedents');
        Schema::dropIfExists('patient_diagnoses');
        Schema::dropIfExists('diagnosis_catalog');
        Schema::dropIfExists('surgical_procedures');
        Schema::dropIfExists('performed_procedures');
        Schema::dropIfExists('procedure_catalog');
        Schema::dropIfExists('deaths');
        Schema::dropIfExists('discharges');
        Schema::dropIfExists('discharge_modes');
        Schema::dropIfExists('patient_insurances');
        Schema::dropIfExists('insurance_companies');
    }
};
