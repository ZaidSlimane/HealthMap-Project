<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('radiology_exam_types', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Seed the exam types
        $types = [
            [1, 'EPAULE (f)'],
            [2, 'CLAVICULE (f)'],
            [3, 'OMOPLATE'],
            [4, 'HUMERUS (f/p)'],
            [6, 'COUDE (f/p)'],
            [8, 'AVANT-BRAS(f/p)'],
            [10, 'POIGNET(f/p)'],
            [12, 'MAIN(P)'],
            [14, 'DOIGT(P)'],
            [16, 'BASSIN(f)'],
            [17, 'HANCHE(f)'],
            [18, 'FEMUR(f/p)'],
            [20, 'GENOUX(P)'],
            [22, 'JAMBE(f/p)'],
            [24, 'CHEVILLE(f/p)'],
            [26, 'PIED(P)'],
            [28, 'ORTEILLE(f)'],
            [29, 'ORTEILLE(p)'],
            [30, 'THORAX(f)'],
            [31, 'GRIL-COSTAL (f)'],
            [32, 'GRIL-COSTAL (p)'],
            [33, 'STERNUM'],
            [34, 'HEMITHORAX'],
            [35, 'ARTICULATION STERNO CLAVICULAIRE'],
            [36, 'A,S,P (f)'],
            [37, 'CRANE (P)'],
            [39, 'cavin'],
            [40, 'sinus (f)'],
            [41, 'MAXILLAIRE (f)'],
            [42, 'OPN'],
            [43, 'ATM'],
            [44, 'RACHIS CERVICAL'],
            [45, 'RACHIS DORSAL'],
            [46, 'RACHIS LOMBAIRE'],
            [47, 'RACHIS LOMBO SACRE'],
            [48, 'RACHIS SACRE-COCCYGIEN'],
            [49, 'RACHIS INCIDENCE OBLIQUE QUELQUE SOIT SEGMENT'],
            [51, 'CHOLANGIOGRAPHIE'],
            [52, 'PANORAMIQUE'],
            [53, 'TDM'],
            [54, 'MAMO BILATE'],
            [55, 'MAMO UNILAT'],
            [56, 'UROGRAPHIE'],
            [57, 'C.UTERIN'],
            [58, 'FISTULOGRAPHIE'],
            [59, 'RADIOSCOPIE'],
            [60, 'TRANSIT DE GRELE'],
            [61, 'Echographie (K)'],
            [63, 'BLONDEAU'],
            [64, 'THORAX(P)'],
            [65, 'O P N'],
            [66, 'MAIN(f)'],
            [67, 'CRANE (F)'],
            [68, 'PIED(F)'],
            [69, 'DOIGT(F)'],
            [70, 'GENOUX(F)'],
        ];

        $now = now();
        foreach ($types as [$id, $label]) {
            DB::table('radiology_exam_types')->insert([
                'id' => $id,
                'label' => $label,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('radiology_exam_types');
    }
};
