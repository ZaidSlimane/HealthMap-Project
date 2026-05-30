<?php

namespace App\Modules\ChefService\Exceptions;

use RuntimeException;

class MlServiceException extends RuntimeException
{
    public function __construct(string $message = 'ML Service unavailable', int $code = 0, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
