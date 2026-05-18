<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultation_elements', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->after('sub_category_id')
                ->constrained('consultation_categories')->cascadeOnDelete();
            $table->index(['category_id', 'sub_category_id']);
        });

        // Assign existing Pneumo elements (sub_category 5 & 6) to Pneumologie (category 3)
        DB::table('consultation_elements')
            ->whereIn('sub_category_id', [5, 6])
            ->update(['category_id' => 3]);
    }

    public function down(): void
    {
        Schema::table('consultation_elements', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropIndex(['category_id', 'sub_category_id']);
            $table->dropColumn('category_id');
        });
    }
};
