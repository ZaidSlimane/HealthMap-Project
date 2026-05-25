<?php

namespace App\Modules\Pharmacy\Controllers;

use App\Modules\Pharmacy\Models\Dci;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Manages the LOCAL DCI catalog (healthmap.dci).
 *
 * This table is the FACILITY'S ACTIVE CATALOG — not a copy of the national list.
 * DCIs are created here by "adopting" a drug from the national reference list
 * (pharm_dci_nat via the search-national endpoint) and adding local parameters
 * (stock thresholds, reorder point, default price).
 *
 * Types:
 *   local       — standard daily-use drug in the facility's inventory
 *   orse        — emergency reserve drug (ORSE program)
 *   strategique — high-surveillance drug (psychotropics, narcotics, etc.)
 */
class DciController
{
    // ─── Index ────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $query = Dci::query();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('denomination', 'like', "%{$search}%")
                  ->orWhere('classe_therapeutique', 'like', "%{$search}%");
            });
        }

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        return response()->json(
            $query->orderBy('denomination')
                  ->paginate((int) $request->query('per_page', 25))
        );
    }

    // ─── Store (Create local DCI from national reference) ─────────────────────

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code'                 => 'required|string|max:20|unique:dci,code',
            'denomination'         => 'required|string|max:255',
            'classification'       => 'sometimes|in:nationale,orse,strategique',
            'classe_therapeutique' => 'nullable|string|max:255',
            'type'                 => 'sometimes|in:local,orse,strategique',
            // Local stock parameters
            'seuil_min'            => 'sometimes|integer|min:0',
            'seuil_securite'       => 'sometimes|integer|min:0',
            'point_commande'       => 'sometimes|integer|min:0',
            'prix_defaut'          => 'nullable|numeric|min:0',
            // Validation for strategic type
            'nat_id'               => 'sometimes|integer', // national list reference
        ]);

        // For strategic: must already exist as a local DCI
        if (($data['type'] ?? 'local') === 'strategique') {
            // The denomination must match an existing local DCI
            $existsLocally = Dci::where('denomination', $data['denomination'])
                ->where('type', 'local')
                ->exists();

            if (!$existsLocally) {
                return response()->json([
                    'message' => 'Un médicament stratégique doit d\'abord exister dans le catalogue local (type: local).',
                ], 422);
            }
        }

        $dci = Dci::create($data);
        return response()->json($dci, 201);
    }

    // ─── Show ─────────────────────────────────────────────────────────────────

    public function show(int $id): JsonResponse
    {
        return response()->json(Dci::with('produits')->findOrFail($id));
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(Request $request, int $id): JsonResponse
    {
        $dci = Dci::findOrFail($id);

        $data = $request->validate([
            'code'                 => "sometimes|string|max:20|unique:dci,code,{$id}",
            'denomination'         => 'sometimes|string|max:255',
            'classification'       => 'sometimes|in:nationale,orse,strategique',
            'classe_therapeutique' => 'nullable|string|max:255',
            'type'                 => 'sometimes|in:local,orse,strategique',
            'seuil_min'            => 'sometimes|integer|min:0',
            'seuil_securite'       => 'sometimes|integer|min:0',
            'point_commande'       => 'sometimes|integer|min:0',
            'prix_defaut'          => 'nullable|numeric|min:0',
        ]);

        $dci->update($data);
        return response()->json($dci->fresh());
    }

    // ─── Destroy ──────────────────────────────────────────────────────────────

    public function destroy(int $id): JsonResponse
    {
        Dci::findOrFail($id)->delete();
        return response()->json(null, 204);
    }

    // ─── Search National List (dem_legacy.pharm_dci_nat) ─────────────────────

    /**
     * Live typeahead search against the national reference list.
     * Used by the "Pick from National List" feature in the create-DCI drawer.
     * Results are NOT stored in healthmap.dci — only used to auto-fill the form.
     */
    public function searchNational(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));

        if (strlen($q) < 2) {
            return response()->json([]);
        }

        $classeT = DB::connection('legacy')
            ->table('pharm_classe_t')
            ->pluck('LIBELLE', 'CODE');

        $classeS = DB::connection('legacy')
            ->table('pharm_classe_s')
            ->get(['CODE', 'SCODE', 'LIBELLE'])
            ->mapWithKeys(fn($r) => ["{$r->CODE}_{$r->SCODE}" => $r->LIBELLE]);

        $rows = DB::connection('legacy')
            ->table('pharm_dci_nat')
            ->where('LIBELLE', 'like', "%{$q}%")
            ->whereNotNull('LIBELLE')
            ->orderBy('LIBELLE')
            ->limit(30)
            ->get();

        $results = $rows->map(function ($r) use ($classeT, $classeS) {
            $ct     = (int)($r->C_T ?? 0);
            $st     = trim($r->S_T ?? '');
            $subKey = "{$ct}_{$st}";

            $classeLabel = ($st && $classeS->has($subKey))
                ? $classeS[$subKey]
                : ($ct ? ($classeT[$ct] ?? null) : null);

            $tableau = strtoupper(trim($r->TABLEAU  ?? ''));
            $typeMed = strtoupper(trim($r->TYPE_MED ?? ''));

            // Determine suggested local type
            $suggestedType = 'local';
            if ($typeMed === 'P' || $typeMed === 'S') {
                $suggestedType = 'strategique';
            }

            // Determine national classification
            if ($typeMed === 'P' || $typeMed === 'S') {
                $classification = 'strategique';
            } elseif ($tableau === 'C') {
                $classification = 'orse';
            } else {
                $classification = 'nationale';
            }

            // Check if already in local catalog
            $alreadyLocal = Dci::where('denomination', trim($r->LIBELLE))->exists();

            return [
                'nat_id'               => $r->id_dci_nat,
                'denomination'         => trim($r->LIBELLE),
                'classification'       => $classification,
                'classe_therapeutique' => $classeLabel,
                'suggested_type'       => $suggestedType,
                'already_local'        => $alreadyLocal,
            ];
        });

        return response()->json($results);
    }
}
