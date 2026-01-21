<?php

namespace App\Http\Controllers\Cursos;

use App\Http\Controllers\Controller;
use App\Services\Cursos\CursoReporteService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CursoReporteController extends Controller
{
    protected CursoReporteService $reporteService;

    public function __construct(CursoReporteService $reporteService)
    {
        $this->reporteService = $reporteService;
    }

    /**
     * Obtener reportes de contenido
     */
    public function getReportes(Request $request)
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
                'curso_id',
                'tipo_reporte',
                'rango_predefinido' // Ignorar este parámetro del frontend
            ]);

            // Limpiar filtros vacíos y convertir curso_id a int si existe
            $filters = array_filter($filters, function($value) {
                return $value !== '' && $value !== null;
            });
            
            // Convertir curso_id a int si existe
            if (isset($filters['curso_id']) && is_numeric($filters['curso_id'])) {
                $filters['curso_id'] = (int)$filters['curso_id'];
            } else {
                unset($filters['curso_id']);
            }
            
            // Eliminar rango_predefinido ya que no se usa en el backend
            unset($filters['rango_predefinido']);

            $reportes = $this->reporteService->getReportes($user, $filters);

            return response()->json([
                'status' => 'success',
                'data' => $reportes
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            Log::error("Error de base de datos en CursoReporteController@getReportes: " . $e->getMessage());
            Log::error("SQL: " . $e->getSql());
            return response()->json([
                'status' => 'error',
                'message' => 'Error de base de datos al obtener reportes'
            ], 500);
        } catch (\Throwable $e) {
            Log::error("Error CursoReporteController@getReportes: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            Log::error("File: " . $e->getFile() . " Line: " . $e->getLine());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener reportes'
            ], 500);
        }
    }

    /**
     * Obtener analíticas detalladas de un curso
     */
    public function getAnaliticasCurso(Request $request, $cursoID)
    {
        try {
            $user = $request->user();
            $analiticas = $this->reporteService->getAnaliticasCurso($cursoID, $user);

            return response()->json([
                'status' => 'success',
                'data' => $analiticas
            ]);
        } catch (\Throwable $e) {
            Log::error("Error CursoReporteController@getAnaliticasCurso: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener analíticas'
            ], 500);
        }
    }
}

