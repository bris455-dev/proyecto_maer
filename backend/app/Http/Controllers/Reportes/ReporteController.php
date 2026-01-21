<?php

namespace App\Http\Controllers\Reportes;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\ReporteService;
use Illuminate\Support\Facades\Log;

class ReporteController extends Controller
{
    protected ReporteService $service;

    public function __construct(ReporteService $service)
    {
        $this->service = $service;
    }

    /**
     * Endpoint principal: dashboard + tabla filtrada
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            // Solo los filtros válidos
            $filters = $request->only([
                'fecha_inicio',
                'fecha_fin',
                'clienteID',
                'empleadoID',
                'tipo_pieza'
            ]);

            $data = $this->service->generate($filters, $user);

            return response()->json([
                'status' => 'success',
                'dashboard' => $data['dashboard'],
                'report' => $data['report']
            ]);
        } catch (\Throwable $e) {
            Log::error("Error ReporteController@index: " . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Error al generar el reporte'
            ], 500);
        }
    }

    /**
     * Exportar Excel
     */
    public function export(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            $filters = $request->only([
                'fecha_inicio',
                'fecha_fin',
                'clienteID',
                'empleadoID',
                'tipo_pieza'
            ]);

            $data = $this->service->generate($filters, $user);
            
            if (empty($data['report']) || (is_array($data['report']) && count($data['report']) === 0)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No hay datos para exportar'
                ], 400);
            }

            Log::info("Exportando reporte con " . count($data['report']) . " registros");
            
            return $this->service->exportExcel($data['report'], 'reporte_' . date('Y-m-d') . '.xlsx');
        } catch (\Throwable $e) {
            Log::error("Error ReporteController@export: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());

            return response()->json([
                'status' => 'error',
                'message' => 'Error al exportar el reporte: ' . (config('app.debug') ? $e->getMessage() : 'Error interno'),
                'debug' => config('app.debug') ? [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ] : null
            ], 500);
        }
    }
}
