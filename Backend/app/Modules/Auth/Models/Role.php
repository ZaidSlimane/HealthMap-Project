<?php

namespace App\Modules\Auth\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

class Role extends Model
{
    protected $fillable = ['role', 'parent_id'];

    // ─── Relationships ─────────────────────────────────────────────────────────

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class);
    }

    /**
     * Parent role in the hierarchy (this role inherits from its children).
     * A senior role (parent) inherits all permissions of its descendants.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'parent_id');
    }

    /**
     * Direct child roles (junior roles whose permissions this role inherits).
     */
    public function children(): HasMany
    {
        return $this->hasMany(Role::class, 'parent_id');
    }

    // ─── Hierarchy Helpers ─────────────────────────────────────────────────────

    /**
     * Get all descendant roles (children, grandchildren, etc.) recursively.
     * Uses eager loading to avoid N+1 — safe at typical hospital scale (<50 roles).
     */
    public function descendants(): Collection
    {
        $descendants = collect();
        $children = $this->children()->with('children')->get();

        foreach ($children as $child) {
            $descendants->push($child);
            $descendants = $descendants->merge($child->descendants());
        }

        return $descendants;
    }

    /**
     * Get all ancestor roles (parent, grandparent, etc.) up the chain.
     */
    public function ancestors(): Collection
    {
        $ancestors = collect();
        $current = $this->parent;

        while ($current) {
            $ancestors->push($current);
            $current = $current->parent;
        }

        return $ancestors;
    }

    /**
     * Get all permissions for this role INCLUDING inherited permissions
     * from all descendant roles in the hierarchy.
     *
     * Senior roles inherit everything their juniors can do.
     */
    public function allPermissions(): Collection
    {
        // This role's direct permissions
        $permissions = $this->permissions()->get();

        // Merge permissions from all descendant roles
        foreach ($this->descendants() as $descendant) {
            $permissions = $permissions->merge($descendant->permissions()->get());
        }

        return $permissions->unique('id')->values();
    }

    /**
     * Check if this role (or any descendant) has a specific permission.
     */
    public function hasPermission(string $permissionSlug): bool
    {
        return $this->allPermissions()->contains('slug', $permissionSlug);
    }

    /**
     * Check if this role has a wildcard permission that implies the given slug.
     * Supports Apache Shiro-style wildcards: "lab.*" implies "lab.view_worklist".
     */
    public function impliesPermission(string $permissionSlug): bool
    {
        $allPerms = $this->allPermissions();

        foreach ($allPerms as $perm) {
            if ($perm->slug === $permissionSlug) {
                return true;
            }

            // Wildcard check: "lab.*" implies "lab.anything"
            if (str_ends_with($perm->slug, '.*')) {
                $prefix = substr($perm->slug, 0, -1); // "lab."
                if (str_starts_with($permissionSlug, $prefix)) {
                    return true;
                }
            }
        }

        return false;
    }
}
