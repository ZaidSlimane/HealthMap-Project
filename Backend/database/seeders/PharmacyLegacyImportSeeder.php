<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Imports the facility's LOCAL DCI catalog from legacy pharm_dci into
 * healthmap.dci (type = 'local').
 *
 * Source: dem_legacy.pharm_dci  (1312 rows — the facility's actual inventory)
 *
 * The national reference (pharm_dci_nat) is NOT imported here.
 * It is queried live from dem_legacy via GET /pharmacy/dci/search-national.
 *
 * Safe to re-run (upsert on code).
 */
class PharmacyLegacyImportSeeder extends Seeder
{
    private array $classeT = [];
    private array $classeS = [];

    public function run(): void
    {
        $this->command->info('Building therapeutic class lookups...');
        $this->buildLookups();

        $this->command->info('Importing LOCAL DCI catalog from pharm_dci...');
        $this->importLocalDci();

        $this->command->info('');
        $this->printSummary();
    }

    private function buildLookups(): void
    {
        $this->classeT = DB::connection('legacy')
            ->table('pharm_classe_t')
            ->pluck('LIBELLE', 'CODE')
            ->toArray();

        $this->classeS = DB::connection('legacy')
            ->table('pharm_classe_s')
            ->get(['CODE', 'SCODE', 'LIBELLE'])
            ->mapWithKeys(fn($r) => ["{$r->CODE}_{$r->SCODE}" => $r->LIBELLE])
            ->toArray();

        $this->command->line('  classeT: ' . count($this->classeT) . ' | classeS: ' . count($this->classeS));
    }

    private function importLocalDci(): void
    {
        $rows = DB::connection('legacy')
            ->table('pharm_dci')
            ->whereNotNull('LIBELLE')
            ->where('LIBELLE', '!=', '')
            ->orderBy('id_dci')
            ->get();

        $now   = now();
        $batch = [];

        foreach ($rows as $r) {
            $classeLabel = $this->resolveClasse((int)($r->C_T ?? 0), trim($r->S_T ?? ''));

            $tableau = strtoupper(trim($r->TABLEAU  ?? ''));
            $typeMed = strtoupper(trim($r->TYPE_MED ?? ''));

            // type in our model: strategique for P/S drugs, local for everything else
            // (ORSE entries are created separately via the ORSE workflow)
            $type = ($typeMed === 'P' || $typeMed === 'S') ? 'strategique' : 'local';

            // national classification
            if ($typeMed === 'P' || $typeMed === 'S') {
                $classification = 'strategique';
            } elseif ($tableau === 'C') {
                $classification = 'orse';
            } else {
                $classification = 'nationale';
            }

            $batch[] = [
                'code'                 => 'DCI' . str_pad((string)$r->id_dci, 6, '0', STR_PAD_LEFT),
                'type'                 => $type,
                'denomination'         => trim($r->LIBELLE),
                'classification'       => $classification,
                'classe_therapeutique' => $classeLabel,
                'seuil_min'            => is_numeric($r->STOCK_MINI)  ? max(0, (int)$r->STOCK_MINI)  : 0,
                'seuil_securite'       => is_numeric($r->STOCK_SECU)  ? max(0, (int)$r->STOCK_SECU)  : 0,
                'point_commande'       => is_numeric($r->POINT_COMM)  ? max(0, (int)$r->POINT_COMM)  : 0,
                'prix_defaut'          => is_numeric($r->PRIX_DEF)    ? (float)$r->PRIX_DEF           : null,
                'created_at'           => $now,
                'updated_at'           => $now,
            ];

            if (count($batch) >= 250) {
                $this->flushBatch($batch);
                $batch = [];
            }
        }

        if ($batch) {
            $this->flushBatch($batch);
        }
    }

    private function flushBatch(array $batch): void
    {
        DB::table('dci')->upsert(
            $batch,
            ['code'],
            ['type', 'denomination', 'classification', 'classe_therapeutique',
             'seuil_min', 'seuil_securite', 'point_commande', 'prix_defaut', 'updated_at']
        );
    }

    private function resolveClasse(int $ct, string $st): ?string
    {
        if (!$ct) return null;
        $subKey = "{$ct}_{$st}";
        if ($st && isset($this->classeS[$subKey])) return $this->classeS[$subKey];
        return $this->classeT[$ct] ?? null;
    }

    private function printSummary(): void
    {
        $total       = DB::table('dci')->count();
        $local       = DB::table('dci')->where('type', 'local')->count();
        $orse        = DB::table('dci')->where('type', 'orse')->count();
        $strategique = DB::table('dci')->where('type', 'strategique')->count();
        $withSeuil   = DB::table('dci')->where('seuil_min', '>', 0)->count();
        $withPrix    = DB::table('dci')->whereNotNull('prix_defaut')->count();
        $nationale   = DB::table('dci')->where('classification', 'nationale')->count();

        $this->command->info('════════════════════════════════════════');
        $this->command->info("  Total DCI (local catalog) : {$total}");
        $this->command->info("  Type local                : {$local}");
        $this->command->info("  Type ORSE                 : {$orse}");
        $this->command->info("  Type Stratégique          : {$strategique}");
        $this->command->info("  With seuil_min > 0        : {$withSeuil}");
        $this->command->info("  With prix_defaut          : {$withPrix}");
        $this->command->info("  Classification nationale  : {$nationale}");
        $this->command->info('════════════════════════════════════════');
        $this->command->info('Import complete.');
    }
}
