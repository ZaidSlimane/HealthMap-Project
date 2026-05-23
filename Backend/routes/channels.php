<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('radiology.requests', fn($user) => $user->roles()->whereIn('role', ['Admin', 'RadioTech', 'Doctor'])->exists());
Broadcast::channel('radiology.results', fn($user) => $user->roles()->whereIn('role', ['Admin', 'Doctor'])->exists());
Broadcast::channel('laboratory.requests', fn($user) => $user->roles()->whereIn('role', ['Admin', 'LabTech', 'Doctor'])->exists());
Broadcast::channel('laboratory.results', fn($user) => $user->roles()->whereIn('role', ['Admin', 'Doctor'])->exists());

// Service channels — for real-time bed/admission updates
// Any authenticated user viewing a service page can receive updates
Broadcast::channel('service.{serviceId}', fn($user) => $user !== null);
