<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add box_id to consultations (replaces legacy `box` column)
        Schema::table('consultations', function (Blueprint $table) {
            $table->foreignId('box_id')->nullable()->after('user_id')
                ->constrained('boxes')->nullOnDelete();
            $table->index('box_id');
        });

        // Add box_id to waiting_lists for box-level queue routing
        Schema::table('waiting_lists', function (Blueprint $table) {
            $table->foreignId('box_id')->nullable()->after('service_id')
                ->constrained('boxes')->nullOnDelete();
            $table->index(['box_id', 'status']);
        });

        // Categories: medical specialties for consultation templates
        // (Cardiologie, Endocrinologie, Pneumologie, etc.)
        Schema::create('consultation_categories', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->string('code', 50)->nullable()->unique();
            $table->string('icon', 50)->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Sub-categories: sections of a consultation
        // (Signes généraux, Mesures, Facteurs de risque, Antécédents pathologiques,
        //  Signes fonctionnels, Signes physiques, Syndromes, Examens, Images, Examens complémentaires)
        Schema::create('consultation_sub_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained('consultation_categories')->cascadeOnDelete();
            $table->string('label');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Elements: the actual selectable items (symptoms, exams, signs)
        // grouped under a sub-category. Replaces both legacy `consultation`
        // (templates dictionary) and `consultation_element` (symptoms).
        Schema::create('consultation_elements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sub_category_id')->constrained('consultation_sub_categories')->cascadeOnDelete();
            $table->string('label_positive');                      // e.g., "Toux"
            $table->string('label_negative')->nullable();          // e.g., "Pas de toux"
            $table->string('label_neutral')->nullable();           // e.g., "Toux: ?"
            $table->string('type', 30)->default('symptom');        // symptom | measure | exam | image | history
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('type');
        });

        // Selections made during a consultation (what the doctor ticked)
        Schema::create('consultation_findings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('element_id')->constrained('consultation_elements')->cascadeOnDelete();
            $table->string('value', 20)->default('positive');      // positive | negative | neutral
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['consultation_id', 'element_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultation_findings');
        Schema::dropIfExists('consultation_elements');
        Schema::dropIfExists('consultation_sub_categories');
        Schema::dropIfExists('consultation_categories');

        Schema::table('waiting_lists', function (Blueprint $table) {
            $table->dropForeign(['box_id']);
            $table->dropIndex(['box_id', 'status']);
            $table->dropColumn('box_id');
        });
        Schema::table('consultations', function (Blueprint $table) {
            $table->dropForeign(['box_id']);
            $table->dropIndex(['box_id']);
            $table->dropColumn('box_id');
        });
    }
};
