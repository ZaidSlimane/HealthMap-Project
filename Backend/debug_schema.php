<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "patients columns: " . implode(', ', \Illuminate\Support\Facades\Schema::getColumnListing('patients')) . PHP_EOL;
echo "admissions columns: " . implode(', ', \Illuminate\Support\Facades\Schema::getColumnListing('admissions')) . PHP_EOL;
