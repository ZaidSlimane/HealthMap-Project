<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class ResultReady implements ShouldBroadcast
{
    use SerializesModels;

    public function __construct(public string $module, public int $requestId)
    {
    }

    public function broadcastOn(): array
    {
        return [new Channel("{$this->module}.results")];
    }
}
