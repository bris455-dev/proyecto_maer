<?php

namespace App\Http\Controllers\Cursos;

use App\Http\Controllers\Controller;
use App\Services\Cursos\CursoDashboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CursoDashboardController extends Controller
{
    protected CursoDashboardService $dashboardService;

    public function __construct(CursoDashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * Obtener KPIs y métricas del dashboard
     */
    public function getKPIs(Request $request)
    {
        try {
            $user = $request->user();
            $kpis = $this->dashboardService->getKPIs($user);

            return response()->json([
                'status' => 'success',
                'data' => $kpis
            ]);
        } catch (\Throwable $e) {
            Log::error("Error CursoDashboardController@getKPIs: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener KPIs'
            ], 500);
        }
    }

    /**
     * Obtener lista completa de cursos con filtros avanzados
     */
    public function getCursosList(Request $request)
    {
        try {
            $user = $request->user();
            $filters = $request->only([
                'busqueda',
                'estado',
                'nivel_id',
                'software_id',
                'aplicacion_id',
                'produccion_id',
                'precio_min',
                'precio_max',
                'gratis',
                'sort_by',
                'sort_order',
                'page',
                'per_page'
            ]);

            $result = $this->dashboardService->getCursosList($user, $filters);

            return response()->json([
                'status' => 'success',
                'data' => $result
            ]);
        } catch (\Throwable $e) {
            Log::error("Error CursoDashboardController@getCursosList: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener lista de cursos'
            ], 500);
        }
    }

    /**
     * Obtener resumen por nivel
     */
    public function getResumenPorNivel(Request $request)
    {
        try {
            $user = $request->user();
            $resumen = $this->dashboardService->getResumenPorNivel($user);

            return response()->json([
                'status' => 'success',
                'data' => $resumen
            ]);
        } catch (\Throwable $e) {
            Log::error("Error CursoDashboardController@getResumenPorNivel: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener resumen por nivel'
            ], 500);
        }
    }

    /**
     * Obtener últimos cursos modificados
     */
    public function getUltimosCursos(Request $request)
    {
        try {
            $user = $request->user();
            $limit = $request->input('limit', 5);
            $cursos = $this->dashboardService->getUltimosCursos($user, $limit);

            return response()->json([
                'status' => 'success',
                'data' => $cursos
            ]);
        } catch (\Throwable $e) {
            Log::error("Error CursoDashboardController@getUltimosCursos: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener últimos cursos'
            ], 500);
        }
    }
}

