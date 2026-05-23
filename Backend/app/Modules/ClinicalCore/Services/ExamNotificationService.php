<?php

namespace App\Modules\ClinicalCore\Services;

use App\Events\ExamRequested;
use App\Events\ResultReady;
use App\Events\RequestCancelled;

class ExamNotificationService
{
    /**
     * Dispatch ExamRequested event via Redis/Reverb.
     * Called AFTER DB persistence — Redis is transport only.
     */
    public function notifyExamRequested(string $module, mixed $payload): void
    {
        broadcast(new ExamRequested($module, $payload))->toOthers();
    }

    /**
     * Dispatch ResultReady event via Redis/Reverb.
     * Called AFTER result is persisted in DB.
     */
    public function notifyResultReady(string $module, int $requestId): void
    {
        broadcast(new ResultReady($module, $requestId))->toOthers();
    }

    /**
     * Dispatch RequestCancelled event via Redis/Reverb.
     * Called AFTER cancellation is persisted in DB.
     */
    public function notifyRequestCancelled(string $module, int $requestId): void
    {
        broadcast(new RequestCancelled($module, $requestId))->toOthers();
    }
}
