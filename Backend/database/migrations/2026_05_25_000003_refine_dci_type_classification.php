<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Refines the dci table to properly model the legacy data structure:
 *
 *   type (enum):
 *     'local'       — drug is in the facility's active inventory (from pharm_dci)
 *     'orse'        — drug is in the facility's emergency reserve (pharm_dci_orse)
 *     'strategique' — high-surveillance drug requiring stricter audit (pharm_dci_stra)
 *
 *   classification (enum) — kept, but now correctly reflects national formulary status:
 *     'nationale'   — standard nationally-listed drug (TABLEAU A/blank, TYPE_MED M)
 *     'orse'        — NOTE: this was a naming collision; kept for backward compat
 *                     but 'type' is the authoritative field for ORSE status
 *     'strategique' — psychotrope or stupéfiant (TYPE_MED P or S)
 *
 * The seeder (PharmacyLegacyImportSeeder) previously imported pharm_dci rows
 * (with code prefix DCI...) and pharm_dci_nat rows (with prefix NAT...).
 * After this migration:
 *   - DCI-prefixed rows → type = 'local'  (facility's actual inventory)
 *   - NAT-prefixed rows → type = 'local' only if they match a pharm_dci row,
 *                         otherwise they stay in the national reference and
 *                         are NOT imported into this table at all (queried live
 *                         from dem_legacy via the search-national endpoint)
 *
 * We WIPE the NAT rows from healthmap.dci — they don't belong here.
 * The dci table = facility's LOCAL catalog only.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dci', function (Blueprint $table) {
            // Type of DCI entry from a facility perspective
            $table->enum('type', ['local', 'orse', 'strategique'])
                  ->default('local')
                  ->after('code');

            // Stock threshold fields (moved here from produits; DCI owns the thresholds)
            $table->unsignedInteger('seuil_min')->default(0)->after('classe_therapeutique');
            $table->unsignedInteger('seuil_securite')->default(0)->after('seuil_min');
            $table->unsignedInteger('point_commande')->default(0)->after('seuil_securite');
            $table->decimal('prix_defaut', 10, 2)->nullable()->after('point_commande');
        });

        // Remove the NAT-prefixed rows — they belong in dem_legacy, not here.
        // The local catalog is only what was in pharm_dci (DCI-prefixed rows).
        DB::table('dci')->where('code', 'like', 'NAT%')->delete();

        // Mark all remaining (DCI-prefixed) rows as type = 'local'
        DB::table('dci')->update(['type' => 'local']);
    }

    public function down(): void
    {
        Schema::table('dci', function (Blueprint $table) {
            $table->dropColumn(['type', 'seuil_min', 'seuil_securite', 'point_commande', 'prix_defaut']);
        });
    }
};
