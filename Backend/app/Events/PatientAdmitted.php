<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

/**
 * Dispatched AFTER the admission is fully persisted in the database.
 * Redis is used only as the transport layer — no business data stored in Redis.
 * The frontend receives this event and refreshes the bed grid + patient list.
 */
class PatientAdmitted implements ShouldBroadcast
{
    use SerializesModels;

    public function __construct(
        public int $admissionId,
        public int $serviceId,
        public int $bedId,
        public string $patientName,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel("service.{$this->serviceId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'patient.admitted';
    }
}
