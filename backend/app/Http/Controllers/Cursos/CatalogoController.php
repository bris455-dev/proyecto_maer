<?php

namespace App\Http\Controllers\Cursos;

use App\Http\Controllers\Controller;
use App\Models\Software;
use App\Models\Aplicacion;
use App\Models\Nivel;
use App\Models\Produccion;
use Illuminate\Http\Request;

class CatalogoController extends Controller
{
    /**
     * Obtener todas las opciones de filtros para el catálogo
     */
    public function getFiltros()
    {
        try {
            $software = Software::orderBy('orden')->get();
            $aplicaciones = Aplicacion::orderBy('categoria')->orderBy('orden')->get();
            $niveles = Nivel::orderBy('orden')->get();
            $producciones = Produccion::orderBy('orden')->get();

            // Agrupar aplicaciones por categoría
            $aplicacionesAgrupadas = $aplicaciones->groupBy('categoria');

            return response()->json([
                'status' => 'success',
                'data' => [
                    'software' => $software,
                    'aplicaciones' => $aplicaciones,
                    'aplicaciones_agrupadas' => $aplicacionesAgrupadas,
                    'niveles' => $niveles,
                    'producciones' => $producciones,
                ]
            ]);
        } catch (\Throwable $e) {
            \Log::error("Error CatalogoController@getFiltros: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener filtros'
            ], 500);
        }
    }
}

