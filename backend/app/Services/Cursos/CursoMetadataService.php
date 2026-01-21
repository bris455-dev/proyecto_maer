<?php

namespace App\Services\Cursos;

use App\Models\Software;
use App\Models\Aplicacion;
use App\Models\Nivel;
use App\Models\Produccion;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class CursoMetadataService
{
    /**
     * Obtener todos los metadatos
     */
    public function getAllMetadata()
    {
        try {
            return [
                'software' => Software::orderBy('nombre')->get(),
                'aplicaciones' => Aplicacion::orderBy('nombre')->get(),
                'niveles' => Nivel::orderBy('nombre')->get(),
                'producciones' => Produccion::orderBy('nombre')->get()
            ];
        } catch (\Throwable $e) {
            Log::error("Error CursoMetadataService@getAllMetadata: " . $e->getMessage());
            return [
                'software' => [],
                'aplicaciones' => [],
                'niveles' => [],
                'producciones' => []
            ];
        }
    }

    /**
     * Crear software
     */
    public function createSoftware(string $nombre)
    {
        return Software::create(['nombre' => $nombre]);
    }

    /**
     * Crear aplicación
     */
    public function createAplicacion(string $nombre)
    {
        return Aplicacion::create(['nombre' => $nombre]);
    }

    /**
     * Crear nivel
     */
    public function createNivel(string $nombre)
    {
        return Nivel::create(['nombre' => $nombre]);
    }

    /**
     * Crear producción
     */
    public function createProduccion(string $nombre)
    {
        return Produccion::create(['nombre' => $nombre]);
    }

    /**
     * Actualizar software
     */
    public function updateSoftware(int $id, string $nombre)
    {
        $software = Software::findOrFail($id);
        $software->nombre = $nombre;
        $software->save();
        return $software;
    }

    /**
     * Actualizar aplicación
     */
    public function updateAplicacion(int $id, string $nombre)
    {
        $aplicacion = Aplicacion::findOrFail($id);
        $aplicacion->nombre = $nombre;
        $aplicacion->save();
        return $aplicacion;
    }

    /**
     * Actualizar nivel
     */
    public function updateNivel(int $id, string $nombre)
    {
        $nivel = Nivel::findOrFail($id);
        $nivel->nombre = $nombre;
        $nivel->save();
        return $nivel;
    }

    /**
     * Actualizar producción
     */
    public function updateProduccion(int $id, string $nombre)
    {
        $produccion = Produccion::findOrFail($id);
        $produccion->nombre = $nombre;
        $produccion->save();
        return $produccion;
    }

    /**
     * Eliminar software
     */
    public function deleteSoftware(int $id)
    {
        // Verificar si está siendo usado
        $enUso = DB::table('curso_software')
            ->where('software_id', $id)
            ->exists();

        if ($enUso) {
            throw new \Exception('No se puede eliminar el software porque está siendo usado en cursos');
        }

        Software::findOrFail($id)->delete();
    }

    /**
     * Eliminar aplicación
     */
    public function deleteAplicacion(int $id)
    {
        // Verificar si está siendo usada
        $enUso = DB::table('curso_aplicacion')
            ->where('aplicacion_id', $id)
            ->exists();

        if ($enUso) {
            throw new \Exception('No se puede eliminar la aplicación porque está siendo usada en cursos');
        }

        Aplicacion::findOrFail($id)->delete();
    }

    /**
     * Eliminar nivel
     */
    public function deleteNivel(int $id)
    {
        // Verificar si está siendo usado
        $enUso = DB::table('curso_nivel')
            ->where('nivel_id', $id)
            ->exists();

        if ($enUso) {
            throw new \Exception('No se puede eliminar el nivel porque está siendo usado en cursos');
        }

        Nivel::findOrFail($id)->delete();
    }

    /**
     * Eliminar producción
     */
    public function deleteProduccion(int $id)
    {
        // Verificar si está siendo usada
        $enUso = DB::table('curso_produccion')
            ->where('produccion_id', $id)
            ->exists();

        if ($enUso) {
            throw new \Exception('No se puede eliminar la producción porque está siendo usada en cursos');
        }

        Produccion::findOrFail($id)->delete();
    }
}

