<?php

namespace App\Http\Controllers\Reportes;

use App\Http\Controllers\Controller;
use App\Requests\Reportes\ExportReporteRequest;
use App\Services\ReporteExportService;
use App\DTOs\Reporte\ExportReporteDTO;
use Illuminate\Support\Facades\Log;

class ReporteExportController extends Controller
{
    protected ReporteExportService $exportService;

    public function __construct(ReporteExportService $exportService)
    {
        $this->exportService = $exportService;
    }

    /**
     * Exportar reporte a Excel
     */
    public function export(ExportReporteRequest $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            // Crear DTO desde request validado
            $dto = new ExportReporteDTO($request->all());

            // Exportar
            return $this->exportService->exportToExcel($dto, $user);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning("Error de validación en ReporteExportController@export: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación: ' . $e->getMessage(),
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error ReporteExportController@export: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            Log::error("File: " . $e->getFile() . " Line: " . $e->getLine());

            return response()->json([
                'status' => 'error',
                'message' => 'Error al exportar el reporte: ' . (config('app.debug') ? $e->getMessage() : 'Error interno'),
                'debug' => config('app.debug') ? [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString()
                ] : null
            ], 500);
        }
    }
}

