<?php

namespace App\Services;

use App\Models\Proyecto;
use App\DTOs\Reporte\ExportReporteDTO;
use App\Exports\ReportExport;
use Illuminate\Support\Facades\Log;

class ReporteExportService
{
    protected ReporteService $reporteService;

    public function __construct(ReporteService $reporteService)
    {
        $this->reporteService = $reporteService;
    }

    /**
     * Exportar reporte a Excel
     */
    public function exportToExcel(ExportReporteDTO $dto, $user, string $filename = null)
    {
        try {
            // Convertir DTO a array de filtros, filtrando valores nulos
            $filters = array_filter($dto->toArray(), function($value) {
                return $value !== null && $value !== '';
            });
            
            Log::info("Exportando reporte con filtros: " . json_encode($filters));
            
            // Generar reporte usando el servicio existente
            $data = $this->reporteService->generate($filters, $user);
            
            if (empty($data['report'])) {
                Log::warning("No hay datos para exportar");
                throw new \Exception('No hay datos para exportar con los filtros seleccionados');
            }

            // Convertir Collection a array
            $reportArray = is_array($data['report']) ? $data['report'] : $data['report']->toArray();
            
            if (empty($reportArray)) {
                Log::warning("Array de reporte vacío después de conversión");
                throw new \Exception('No hay datos para exportar');
            }
            
            $reportArray = array_values($reportArray);

            // Generar nombre de archivo si no se proporciona
            if (!$filename) {
                $filename = 'reporte_' . date('Y-m-d_His') . '.xlsx';
            }

            Log::info("Exportando reporte con " . count($reportArray) . " registros");

            // Usar PhpSpreadsheet directamente
            $export = new ReportExport($reportArray);
            return $export->download($filename);
        } catch (\Throwable $e) {
            Log::error("Error ReporteExportService@exportToExcel: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            throw $e;
        }
    }
}

