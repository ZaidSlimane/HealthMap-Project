<?php

namespace App\Modules\ClinicalCore\Concerns;

use App\Modules\ClinicalCore\Models\Establishment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

/**
 * Tenant-scoping trait. Apply to any model whose rows belong to a single
 * establishment.
 *
 * Behavior:
 *   - Adds a global scope so all queries automatically filter by the
 *     current user's establishment_id.
 *   - On create, auto-fills establishment_id from the current user when it
 *     hasn't been set explicitly.
 *
 * Bypass:
 *   - Console / queue / unauthenticated contexts bypass the scope so
 *     seeders, jobs and tests don't break.
 *   - A user without an establishment_id (e.g. the bootstrap onboarding
 *     account) is scoped to a sentinel id that matches nothing — they
 *     have no clinical data of their own and must finish onboarding first.
 *     Cross-tenant reads still go through scopeWithoutEstablishmentScope().
 *
 * Models using this trait MUST have an `establishment_id` column.
 */
trait BelongsToEstablishment
{
    public static function bootBelongsToEstablishment(): void
    {
        // Auto-filter every query.
        static::addGlobalScope('establishment', function (Builder $query) {
            $estId = static::currentEstablishmentId();
            if ($estId !== null) {
                $query->where($query->getModel()->qualifyColumn('establishment_id'), $estId);
            }
        });

        // Auto-fill on create.
        static::creating(function ($model) {
            if (empty($model->establishment_id)) {
                $estId = static::currentEstablishmentId();
                if ($estId !== null) {
                    $model->establishment_id = $estId;
                }
            }
        });
    }

    public function establishment(): BelongsTo
    {
        return $this->belongsTo(Establishment::class);
    }

    /**
     * Resolve the establishment_id of the active actor.
     *
     * Returns null (scope bypassed) for console/queue and unauthenticated
     * contexts. For an authenticated user the scope is ALWAYS applied —
     * a user without an establishment_id is scoped to 0, a sentinel that
     * matches no row, so the bootstrap onboarding account cannot see any
     * tenant's clinical data through the normal CRUD endpoints.
     */
    protected static function currentEstablishmentId(): ?int
    {
        if (app()->runningInConsole()) {
            return null;
        }

        $user = Auth::user();
        if (!$user) {
            return null;
        }

        // A user without an establishment (bootstrap onboarding account,
        // or an Admin not yet linked) sees nothing clinical. Use 0 as a
        // sentinel since establishments.id is a positive auto-increment.
        return (int) ($user->establishment_id ?? 0);
    }

    /**
     * Escape hatch for legitimate cross-tenant queries (e.g., reporting).
     */
    public function scopeWithoutEstablishmentScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope('establishment');
    }
}
