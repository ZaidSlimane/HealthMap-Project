<?php

namespace App\Modules\Auth\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Modules\ClinicalCore\Models\Establishment;
use App\Modules\ClinicalCore\Models\Poste;
use App\Modules\ClinicalCore\Models\Service;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable([
    'matricule', 'name', 'first_name', 'name_ar', 'first_name_ar',
    'email', 'username', 'password', 'is_consultant', 'is_active',
    'poste_id', 'service_id',
    'establishment_id', 'must_change_password',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_consultant' => 'boolean',
            'is_active' => 'boolean',
            'must_change_password' => 'boolean',
            'password_changed_at' => 'datetime',
            'onboarding_completed_at' => 'datetime',
        ];
    }

    public function establishment(): BelongsTo
    {
        return $this->belongsTo(Establishment::class);
    }

    public function poste(): BelongsTo
    {
        return $this->belongsTo(Poste::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * A doctor can belong to multiple services.
     */
    public function services(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Service::class)->withPivot('is_chef');
    }

    /**
     * "Online" derived from the latest session activity for this user.
     * Considered online if last_activity is within the last 5 minutes.
     */
    public function isOnline(int $thresholdSeconds = 300): bool
    {
        $last = \DB::table('sessions')
            ->where('user_id', $this->id)
            ->max('last_activity');
        if (!$last) return false;
        return ($last + $thresholdSeconds) >= time();
    }

    /**
     * Has the user finished the onboarding wizard?
     */
    public function hasCompletedOnboarding(): bool
    {
        return $this->onboarding_completed_at !== null;
    }

    public function roles(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    public function permissions(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Permission::class);
    }

    /**
     * All effective permissions: directly assigned + inherited via roles
     * (including hierarchical inheritance from descendant roles).
     */
    public function allPermissions(): \Illuminate\Support\Collection
    {
        // Direct user permissions
        $direct = $this->permissions()->get();

        // Permissions from all assigned roles (including hierarchy inheritance)
        $viaRoles = collect();
        foreach ($this->roles as $role) {
            $viaRoles = $viaRoles->merge($role->allPermissions());
        }

        return $direct->merge($viaRoles)->unique('id')->values();
    }

    /**
     * Check if the user has a specific permission (supports wildcard implication).
     */
    public function hasPermission(string $permissionSlug): bool
    {
        // Direct permission check
        if ($this->permissions()->where('slug', $permissionSlug)->exists()) {
            return true;
        }

        // Check via roles (with hierarchy and wildcard support)
        foreach ($this->roles as $role) {
            if ($role->impliesPermission($permissionSlug)) {
                return true;
            }
        }

        return false;
    }
}
