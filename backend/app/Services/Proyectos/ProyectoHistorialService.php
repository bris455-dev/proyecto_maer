<?php

namespace App\Services\Proyectos;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProyectoHistorialService
{
    /**
     * Crear entrada inicial en historial con nota
     */
    public function crearNotaInicial(int $proyectoID, string $nota, $actor, ?array $archivos = null): ?int
    {
        if (empty($nota)) {
            return null;
        }
        
        try {
            $usuarioNombre = $actor->nombre ?? $actor->email ?? 'Sistema';
            $historialId = DB::table('proyecto_historial')->insertGetId([
                'proyectoID' => $proyectoID,
                'userID' => $actor->id,
                'usuario_nombre' => $usuarioNombre,
                'nota' => $nota,
                'archivos' => $archivos ? json_encode($archivos) : null,
                'created_at' => now(),
            ]);
            Log::info("✅ Nota inicial guardada en historial. ID: {$historialId}");
            return $historialId;
        } catch (\Throwable $e) {
            Log::warning("No se pudo guardar nota inicial en historial: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Crear entrada en historial solo con archivos
     */
    public function crearEntradaSoloArchivos(int $proyectoID, array $archivos, $actor, string $nota = 'Archivos adjuntos'): ?int
    {
        if (empty($archivos)) {
            return null;
        }
        
        try {
            $usuarioNombre = $actor->nombre ?? $actor->email ?? 'Sistema';
            $historialId = DB::table('proyecto_historial')->insertGetId([
                'proyectoID' => $proyectoID,
                'userID' => $actor->id,
                'usuario_nombre' => $usuarioNombre,
                'nota' => $nota,
                'archivos' => json_encode($archivos),
                'created_at' => now(),
            ]);
            Log::info("✅ Historial creado solo con archivos. ID: {$historialId}");
            return $historialId;
        } catch (\Throwable $e) {
            Log::error("❌ No se pudo crear historial con archivos: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Actualizar última entrada del historial con archivos
     */
    public function actualizarUltimaEntradaConArchivos(int $proyectoID, array $archivos): bool
    {
        if (empty($archivos)) {
            return false;
        }
        
        try {
            $ultimoHistorial = DB::table('proyecto_historial')
                ->where('proyectoID', $proyectoID)
                ->orderBy('created_at', 'desc')
                ->first();
            
            if ($ultimoHistorial) {
                $archivosJson = json_encode($archivos);
                $updated = DB::table('proyecto_historial')
                    ->where('id', $ultimoHistorial->id)
                    ->update(['archivos' => $archivosJson]);
                
                Log::info("✅ Historial actualizado con archivos. ID: {$ultimoHistorial->id}, Filas afectadas: {$updated}");
                return $updated > 0;
            }
            
            return false;
        } catch (\Throwable $e) {
            Log::error("❌ No se pudo actualizar historial con archivos: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Agregar nueva nota al historial
     */
    public function agregarNota(int $proyectoID, string $nota, $actor, ?array $archivos = null): ?int
    {
        if (empty(trim($nota))) {
            return null;
        }
        
        try {
            $usuarioNombre = $actor->nombre ?? $actor->email ?? 'Usuario';
            $historialId = DB::table('proyecto_historial')->insertGetId([
                'proyectoID' => $proyectoID,
                'userID' => $actor->id,
                'usuario_nombre' => $usuarioNombre,
                'nota' => trim($nota),
                'archivos' => $archivos ? json_encode($archivos) : null,
                'created_at' => now(),
            ]);
            Log::info("✅ Nueva nota agregada al historial. ID: {$historialId}");
            return $historialId;
        } catch (\Throwable $e) {
            Log::error("❌ No se pudo agregar nota al historial: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Obtener historial completo de un proyecto
     */
    public function obtenerHistorial(int $proyectoID): array
    {
        try {
            $historial = DB::table('proyecto_historial')
                ->where('proyectoID', $proyectoID)
                ->orderBy('created_at', 'asc')
                ->get();
            
            return $historial->map(function($item) {
                $itemArray = (array)$item;
                if (array_key_exists('archivos', $itemArray)) {
                    $archivos = $itemArray['archivos'];
                    if ($archivos === null) {
                        $itemArray['archivos'] = [];
                    } elseif (is_string($archivos) && !empty($archivos)) {
                        try {
                            $decoded = json_decode($archivos, true);
                            $itemArray['archivos'] = is_array($decoded) ? $decoded : [];
                        } catch (\Throwable $e) {
                            $itemArray['archivos'] = [];
                        }
                    } elseif (is_array($archivos)) {
                        $itemArray['archivos'] = $archivos;
                    } else {
                        $itemArray['archivos'] = [];
                    }
                } else {
                    $itemArray['archivos'] = [];
                }
                return $itemArray;
            })->toArray();
        } catch (\Throwable $e) {
            Log::warning("Tabla proyecto_historial no existe: " . $e->getMessage());
            return [];
        }
    }
}

