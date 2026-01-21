<?php

namespace App\Services\Proyectos;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class ProyectoImageService
{
    /**
     * Registrar imágenes en proyecto_imagenes
     */
    public function registrarImagenes(int $proyectoID, array $rutas): void
    {
        if (empty($rutas) || !Schema::hasTable('proyecto_imagenes')) {
            return;
        }
        
        foreach ($rutas as $ruta) {
            try {
                DB::table('proyecto_imagenes')->insert([
                    'proyectoID' => $proyectoID,
                    'ruta' => $ruta,
                    'created_at' => now(),
                ]);
                Log::info("✅ Imagen registrada en proyecto_imagenes: {$ruta}");
            } catch (\Throwable $e) {
                Log::warning("⚠️ No se pudo registrar en proyecto_imagenes: " . $e->getMessage());
            }
        }
    }
    
    /**
     * Obtener todas las imágenes de un proyecto
     */
    public function obtenerImagenes(int $proyectoID): array
    {
        $todasLasImagenes = [];
        
        // Obtener de proyecto_imagenes
        try {
            if (Schema::hasTable('proyecto_imagenes')) {
                $imagenesTabla = DB::table('proyecto_imagenes')
                    ->where('proyectoID', $proyectoID)
                    ->pluck('ruta')
                    ->toArray();
                $todasLasImagenes = array_merge($todasLasImagenes, $imagenesTabla);
            }
        } catch (\Throwable $e) {
            Log::warning("Error obteniendo imágenes de proyecto_imagenes: " . $e->getMessage());
        }
        
        return array_values(array_unique($todasLasImagenes));
    }
    
    /**
     * Agregar imágenes del historial a la lista
     */
    public function agregarImagenesDelHistorial(array $historial, array $imagenesExistentes): array
    {
        $todasLasImagenes = $imagenesExistentes;
        
        if (!is_array($historial)) {
            return $todasLasImagenes;
        }
        
        foreach ($historial as $item) {
            if (isset($item['archivos']) && is_array($item['archivos']) && !empty($item['archivos'])) {
                foreach ($item['archivos'] as $archivo) {
                    $ruta = is_string($archivo) ? $archivo : ($archivo['ruta'] ?? $archivo['url'] ?? $archivo['path'] ?? null);
                    if ($ruta && !in_array($ruta, $todasLasImagenes)) {
                        $todasLasImagenes[] = $ruta;
                    }
                }
            }
        }
        
        return array_values(array_unique($todasLasImagenes));
    }
}

