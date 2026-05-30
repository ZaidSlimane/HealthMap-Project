<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Modules\Auth\Models\User;
use App\Modules\ChefService\Services\BedPredictionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

// Clear any cached forecast
echo "=== Bed Occupancy Prediction Debug ===" . PHP_EOL;

$user = User::where('username', 'ykitouni')->first();
if (!$user) {
    echo "ERROR: User 'ykitouni' not found" . PHP_EOL;
    exit(1);
}
echo "User: {$user->name} (ID: {$user->id})" . PHP_EOL;

$pivot = DB::table('service_user')
    ->where('user_id', $user->id)
    ->where('is_chef', true)
    ->first();

if (!$pivot) {
    echo "ERROR: No chef assignment found for user" . PHP_EOL;
    echo "service_user records: " . json_encode(
        DB::table('service_user')->where('user_id', $user->id)->get()->toArray()
    ) . PHP_EOL;
    exit(1);
}
echo "Service ID: {$pivot->service_id}" . PHP_EOL;

// Clear cache for this service
Cache::forget('bed_forecast_' . $pivot->service_id);
echo "Cache cleared" . PHP_EOL;

// Try the forecast
$svc = new BedPredictionService();
try {
    $result = $svc->getServiceForecast($pivot->service_id);
    echo "SUCCESS! Forecast entries: " . count($result) . PHP_EOL;
    echo "First entry: " . json_encode($result[0] ?? 'empty') . PHP_EOL;
    echo "Last entry: " . json_encode($result[29] ?? 'empty') . PHP_EOL;
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
    echo "File: " . $e->getFile() . ":" . $e->getLine() . PHP_EOL;
    echo "Trace: " . $e->getTraceAsString() . PHP_EOL;
}
