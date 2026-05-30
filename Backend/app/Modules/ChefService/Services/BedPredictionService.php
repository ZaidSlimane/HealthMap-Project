<?php

namespace App\Modules\ChefService\Services;

use App\Modules\ChefService\Exceptions\MlServiceException;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class BedPredictionService
{
    /**
     * Get the 30-day bed occupancy forecast for a given service.
     *
     * @param  int  $serviceId
     * @return array<int, array{day: int, date: string, occupancy_pct: float}>
     *
     * @throws MlServiceException
     */
    public function getServiceForecast(int $serviceId): array
    {
        return Cache::remember('bed_forecast_'.$serviceId, 3600, function () use ($serviceId) {
            $admissions = $this->getActiveAdmissions($serviceId);

            if ($admissions->isEmpty()) {
                return $this->zeroForecast();
            }

            $capacity = $this->getServiceCapacity($serviceId);
            $features = $this->buildFeatureVectors($admissions);

            return $this->callMlService($features, $capacity, $serviceId);
        });
    }

    /**
     * Query active admissions for the given service with feature data.
     */
    private function getActiveAdmissions(int $serviceId): Collection
    {
        $birthDateColumn = null;

        if (Schema::hasColumn('patients', 'date_of_birth')) {
            $birthDateColumn = 'p.date_of_birth';
        } elseif (Schema::hasColumn('patients', 'date_naissance')) {
            $birthDateColumn = 'p.date_naissance';
        }

        return DB::table('admissions as a')
            ->join('patients as p', 'p.id', '=', 'a.patient_id')
            ->join('services as s', 's.id', '=', 'a.service_id')
            ->leftJoinSub(
                DB::table('labo_demande as ld')
                    ->join('labo_demande_item as ldi', 'ldi.labo_demande_id', '=', 'ld.id')
                    ->select('ld.admission_id', DB::raw('COUNT(ldi.id) as n_labo_items'))
                    ->groupBy('ld.admission_id'),
                'labo',
                'labo.admission_id',
                '=',
                'a.id'
            )
            ->leftJoinSub(
                DB::table('consultations as c')
                    ->join('prescriptions as pr', 'pr.consultation_id', '=', 'c.id')
                    ->select('c.admission_id', DB::raw('COUNT(pr.id) as n_prescriptions'))
                    ->groupBy('c.admission_id'),
                'rx',
                'rx.admission_id',
                '=',
                'a.id'
            )
            ->where('a.service_id', $serviceId)
            ->where('a.status', 'active')
            ->select([
                'a.id',
                'a.date_admission',
                'a.mode',
                'p.gender',
                DB::raw(($birthDateColumn ?? 'NULL').' as date_of_birth'),
                's.name as service_name',
                DB::raw('COALESCE(labo.n_labo_items, 0) as n_labo_items'),
                DB::raw('COALESCE(rx.n_prescriptions, 0) as n_prescriptions'),
            ])
            ->get()
            ->map(function ($admission) {
                // Compute age from date_of_birth
                if ($admission->date_of_birth) {
                    $admission->age = Carbon::parse($admission->date_of_birth)->age;
                } else {
                    $admission->age = 0;
                }
                return $admission;
            });
    }

    /**
     * Count beds linked to the service via rooms → establishment_units.
     */
    private function getServiceCapacity(int $serviceId): int
    {
        return (int) DB::table('beds as b')
            ->join('rooms as r', 'r.id', '=', 'b.room_id')
            ->join('establishment_units as eu', 'eu.id', '=', 'r.establishment_unit_id')
            ->where('eu.service_id', $serviceId)
            ->count('b.id');
    }

    /**
     * Build feature vectors from admission records for the ML service.
     *
     * The ML service expects raw string values for categorical fields (gender,
     * service_name, mode, etc.) and will encode them using mapping.json.
     * Temporal features and rate features are computed here from date_admission.
     *
     * @param  Collection  $admissions
     * @return array<int, array<string, mixed>>
     */
    private function buildFeatureVectors(Collection $admissions): array
    {
        $now = Carbon::now();

        return $admissions->map(function ($admission) use ($now) {
            $admissionDt = Carbon::parse($admission->date_admission);

            // Compute LOS so far in fractional days (for rate calculations)
            $elapsedSeconds = abs($now->diffInSeconds($admissionDt, false));
            $sameDay = $admissionDt->isSameDay($now);
            $lessThanOneHour = $elapsedSeconds < 3600;

            if ($sameDay && $lessThanOneHour) {
                $losSoFarDays = 0.5;
            } else {
                $losSoFarDays = max($elapsedSeconds / 86400.0, 0.5);
            }

            // Get counts (substitute 0 for NULL)
            $nLaboItems = (int) ($admission->n_labo_items ?? 0);
            $nPrescriptions = (int) ($admission->n_prescriptions ?? 0);

            // Calculate rate features
            $labPerDay = $losSoFarDays > 0 ? $nLaboItems / $losSoFarDays : 0.0;
            $rxPerDay = $losSoFarDays > 0 ? $nPrescriptions / $losSoFarDays : 0.0;

            // Gender sent as raw string for ML service encoding
            $gender = $admission->gender ?? '';

            // Map internal service names to the model's training codes.
            // The model was trained on abbreviated English department codes.
            // Default to "MED" (encoded as 3) which is the general medicine department.
            $serviceName = 'MED';

            // Admission mode (from admissions table if available)
            $mode = $admission->mode ?? '';

            return [
                'admission_datetime' => $admissionDt->toIso8601String(),
                // Demographics (raw strings — ML service encodes them)
                'age' => (float) ($admission->age ?? 0),
                'gender' => $gender,
                'marital_status' => $admission->marital_status ?? '',
                'nationality' => $admission->nationality ?? '',
                // Admission context (raw strings)
                'mode' => $mode,
                'service_name' => $serviceName,
                // Temporal features (computed from admission datetime)
                'admit_hour' => $admissionDt->hour,
                'admit_day_of_week' => $admissionDt->dayOfWeekIso - 1, // 0=Monday
                'admit_month' => $admissionDt->month,
                'admit_day_of_month' => $admissionDt->day,
                'is_weekend' => $admissionDt->isWeekend() ? 1 : 0,
                // Season and period derived by ML service from datetime
                // Clinical indicators
                'is_urgent' => (int) ($admission->is_urgent ?? 0),
                'is_elective' => (int) ($admission->is_elective ?? 0),
                'has_triage' => (int) ($admission->has_triage ?? 0),
                'has_death' => 0,
                'has_icu_stay' => 0,
                'n_icu_stays' => 0,
                'icu_los_total' => 0,
                'icu_los_max' => 0,
                // Operational complexity
                'n_movements' => 0,
                'n_rooms' => 0,
                'n_service_changes' => 0,
                // Clinical volume
                'n_diagnoses' => 0,
                'n_performed_procedures' => 0,
                'n_labo_items' => $nLaboItems,
                'n_abnormal_results' => 0,
                'n_prescriptions' => $nPrescriptions,
                'n_unique_medications' => 0,
                'n_vital_signs' => 0,
                'n_surgical_procedures' => 0,
                // Intensity ratios
                'lab_per_day' => round($labPerDay, 4),
                'rx_per_day' => round($rxPerDay, 4),
            ];
        })->all();
    }

    /**
     * Call the ML service to get the occupancy forecast.
     *
     * @param  array  $features
     * @param  int  $capacity
     * @param  int  $serviceId
     * @return array<int, array{day: int, date: string, occupancy_pct: float}>
     *
     * @throws MlServiceException
     */
    private function callMlService(array $features, int $capacity, int $serviceId): array
    {
        $url = config('services.ml_service.url').'/predict/occupancy';

        try {
            $response = Http::timeout(10)->post($url, [
                'patients' => $features,
                'service_capacity' => max($capacity, 1),
            ]);
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Cache::forget('bed_forecast_'.$serviceId);
            throw new MlServiceException('ML Service connection failed: '.$e->getMessage(), 0, $e);
        }

        if ($response->status() === 422) {
            Log::error('ML Service returned 422 for service '.$serviceId, [
                'response' => $response->json(),
            ]);
            Cache::forget('bed_forecast_'.$serviceId);

            return $this->zeroForecast();
        }

        if (! $response->successful()) {
            Cache::forget('bed_forecast_'.$serviceId);
            throw new MlServiceException(
                'ML Service returned HTTP '.$response->status().' for service '.$serviceId
            );
        }

        return $response->json();
    }

    /**
     * Generate a 30-entry zero forecast array.
     *
     * @return array<int, array{day: int, date: string, occupancy_pct: float}>
     */
    private function zeroForecast(): array
    {
        $forecast = [];
        $today = Carbon::today();

        for ($i = 1; $i <= 30; $i++) {
            $forecast[] = [
                'day' => $i,
                'date' => $today->copy()->addDays($i)->toDateString(),
                'occupancy_pct' => 0.0,
            ];
        }

        return $forecast;
    }
}
