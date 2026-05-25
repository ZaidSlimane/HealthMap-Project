<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_geolocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->timestamps();

            $table->unique('service_id'); // One geolocation per service
        });

        // Migrate existing data from services table
        DB::statement("
            INSERT INTO service_geolocations (service_id, latitude, longitude, created_at, updated_at)
            SELECT id, latitude, longitude, NOW(), NOW()
            FROM services
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        ");

        // Remove latitude/longitude from services table
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });

        // Remove code column from services table
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('code');
        });
    }

    public function down(): void
    {
        // Re-add code column
        Schema::table('services', function (Blueprint $table) {
            $table->string('code', 32)->nullable()->after('name');
        });

        // Re-add latitude/longitude to services table
        Schema::table('services', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('max_duration');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });

        // Migrate data back
        DB::statement("
            UPDATE services s
            JOIN service_geolocations sg ON sg.service_id = s.id
            SET s.latitude = sg.latitude, s.longitude = sg.longitude
        ");

        Schema::dropIfExists('service_geolocations');
    }
};
