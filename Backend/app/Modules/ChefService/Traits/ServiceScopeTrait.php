<?php

namespace App\Modules\ChefService\Traits;

trait ServiceScopeTrait
{
    protected function chefServiceId(): int
    {
        $pivot = auth()->user()->services()
            ->wherePivot('is_chef', true)
            ->first();

        abort_unless($pivot, 403, 'No chef assignment found.');

        return $pivot->id;
    }

    protected function authorizeServiceAccess(int $serviceId): void
    {
        abort_unless($serviceId === $this->chefServiceId(), 403,
            'Access denied: resource belongs to another service.');
    }
}
