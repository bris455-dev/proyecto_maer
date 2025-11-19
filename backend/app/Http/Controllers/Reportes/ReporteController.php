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

            $filters = $request->only([
                'fecha_inicio',
                'fecha_fin',
                'clienteID',
                'empleadoID',
                'tipo_pieza'
            ]);

            $data = $this->service->generate($filters, $user);

            return $this->service->exportExcel($data['report']);
        } catch (\Throwable $e) {
            Log::error("Error ReporteController@export: " . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Error al exportar el reporte'
            ], 500);
        }
    }
}
