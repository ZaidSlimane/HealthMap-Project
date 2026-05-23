<?php

namespace App\Modules\Laboratory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Laboratory\Models\LaboDemande;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class LaboDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $now = Carbon::now();

        // Count demandes with status "in_progress"
        $bilan = LaboDemande::where('status', 'in_progress')->count();

        // Average wait time in minutes for pending items
        $delaiAttente = (int) LaboDemande::where('status', 'pending')
            ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, ?)) as avg_wait', [$now])
            ->value('avg_wait') ?? 0;

        // Count demandes with status "pending"
        $examensEnAttente = LaboDemande::where('status', 'pending')->count();

        // Monthly analysis: group by month for the last 12 months
        $monthlyAnalysis = $this->getMonthlyAnalysis($now);

        // Daily analysis: group by day for the last 7 days
        $dailyAnalysis = $this->getDailyAnalysis($now);

        return response()->json([
            'bilan' => $bilan,
            'delai_attente' => $delaiAttente,
            'examens_en_attente' => $examensEnAttente,
            'monthly_analysis' => $monthlyAnalysis,
            'daily_analysis' => $dailyAnalysis,
        ]);
    }

    private function getMonthlyAnalysis(Carbon $now): array
    {
        $startDate = $now->copy()->subMonths(11)->startOfMonth();

        $results = LaboDemande::where('created_at', '>=', $startDate)
            ->selectRaw('YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as total')
            ->groupByRaw('YEAR(created_at), MONTH(created_at)')
            ->orderByRaw('YEAR(created_at), MONTH(created_at)')
            ->get()
            ->keyBy(fn ($item) => $item->year . '-' . str_pad($item->month, 2, '0', STR_PAD_LEFT));

        $months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        $data = [];

        for ($i = 0; $i < 12; $i++) {
            $date = $startDate->copy()->addMonths($i);
            $key = $date->format('Y-m');
            $data[] = [
                'label' => $months[$date->month - 1],
                'value' => $results->has($key) ? $results->get($key)->total : 0,
            ];
        }

        return $data;
    }

    private function getDailyAnalysis(Carbon $now): array
    {
        $startDate = $now->copy()->subDays(6)->startOfDay();

        $results = LaboDemande::where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, COUNT(*) as total')
            ->groupByRaw('DATE(created_at)')
            ->orderByRaw('DATE(created_at)')
            ->get()
            ->keyBy('date');

        $days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        $data = [];

        for ($i = 0; $i < 7; $i++) {
            $date = $startDate->copy()->addDays($i);
            $key = $date->format('Y-m-d');
            $data[] = [
                'label' => $days[$date->dayOfWeek],
                'value' => $results->has($key) ? $results->get($key)->total : 0,
            ];
        }

        return $data;
    }
}
