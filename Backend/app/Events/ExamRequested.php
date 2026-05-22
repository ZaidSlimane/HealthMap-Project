<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class ExamRequested implements ShouldBroadcast
{
    use SerializesModels;

    public function __construct(public string $module, public mixed $payload)
    {
    }

    public function broadcastOn(): array
    {
        return [new Channel("{$this->module}.requests")];
    }
}
