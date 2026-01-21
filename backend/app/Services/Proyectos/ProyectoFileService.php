<?php

namespace App\Services\Proyectos;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class ProyectoFileService
{
    /**
     * Guardar archivos temporalmente
     */
    public function guardarTemporalmente($files): array
    {
        $archivosRutas = [];
        
        if (!$files) {
            return $archivosRutas;
        }
        
        if (!is_array($files)) {
            $files = [$files];
        }
        
        $files = array_filter($files, function($f) { return $f !== null; });
        
        Log::info("📁 Guardando " . count($files) . " archivos temporalmente");
        
        foreach ($files as $file) {
            if ($file && $file->isValid()) {
                try {
                    $tempPath = $file->store('temp', 'public');
                    $archivosRutas[] = $tempPath;
                    Log::info("✅ Archivo temporal guardado: {$tempPath} - Nombre: {$file->getClientOriginalName()} - Tipo: {$file->getMimeType()}");
                } catch (\Throwable $e) {
                    Log::error("❌ Error guardando archivo temporal: " . $e->getMessage());
                }
            }
        }
        
        return $archivosRutas;
    }
    
    /**
     * Mover archivos temporales a la carpeta del proyecto
     */
    public function moverArchivosAlProyecto(int $proyectoID, array $archivosTemporales): array
    {
        if (empty($archivosTemporales)) {
            return [];
        }
        
        $storage = Storage::disk('public');
        $projectFolder = 'proyectos/' . $proyectoID;
        $archivosFinales = [];
        
        // Crear la carpeta del proyecto si no existe
        if (!$storage->exists($projectFolder)) {
            $storage->makeDirectory($projectFolder);
            Log::info("📁 Carpeta del proyecto creada: {$projectFolder}");
        }
        
        foreach ($archivosTemporales as $tempPath) {
            $nombreArchivo = basename($tempPath);
            $nuevoPath = $projectFolder . '/' . $nombreArchivo;
            
            if ($storage->exists($tempPath)) {
                try {
                    $storage->move($tempPath, $nuevoPath);
                    $archivosFinales[] = $nuevoPath;
                    Log::info("✅ Archivo movido de {$tempPath} a {$nuevoPath}");
                } catch (\Throwable $e) {
                    Log::error("❌ Error moviendo archivo: " . $e->getMessage());
                }
            }
        }
        
        return $archivosFinales;
    }
    
    /**
     * Guardar archivos directamente en la carpeta del proyecto (para updates)
     */
    public function guardarArchivosEnProyecto(int $proyectoID, $files): array
    {
        if (!$files) {
            return [];
        }
        
        if (!is_array($files)) {
            $files = [$files];
        }
        
        $files = array_filter($files, function($f) { return $f !== null; });
        $archivosRutas = [];
        
        $storage = Storage::disk('public');
        $projectFolder = 'proyectos/' . $proyectoID;
        
        if (!$storage->exists($projectFolder)) {
            $storage->makeDirectory($projectFolder);
        }
        
        foreach ($files as $file) {
            if ($file && $file->isValid()) {
                try {
                    $path = $file->store($projectFolder, 'public');
                    $archivosRutas[] = $path;
                    Log::info("✅ Archivo guardado en proyecto: {$path}");
                } catch (\Throwable $e) {
                    Log::error("❌ Error guardando archivo: " . $e->getMessage());
                }
            }
        }
        
        return $archivosRutas;
    }
}

