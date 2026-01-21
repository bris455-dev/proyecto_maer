<?php

namespace App\Services;

use App\Models\Curso;
use App\Models\CursoSesion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CursoSesionService
{
    /**
     * Crear sesión
     */
    public function create(int $cursoID, array $data): array
    {
        DB::beginTransaction();
        try {
            $curso = Curso::find($cursoID);
            
            if (!$curso) {
                return [
                    'success' => false,
                    'message' => 'Curso no encontrado'
                ];
            }

            // Obtener el siguiente orden
            $ultimoOrden = CursoSesion::where('cursoID', $cursoID)->max('orden') ?? 0;

            $sesion = CursoSesion::create([
                'cursoID' => $cursoID,
                'nombre' => $data['nombre'],
                'descripcion' => $data['descripcion'] ?? null,
                'orden' => $ultimoOrden + 1,
            ]);

            DB::commit();

            return [
                'success' => true,
                'data' => $sesion->load('archivos')
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error CursoSesionService@create: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al crear sesión: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Actualizar sesión
     */
    public function update(int $sesionID, array $data): array
    {
        DB::beginTransaction();
        try {
            $sesion = CursoSesion::find($sesionID);
            
            if (!$sesion) {
                return [
                    'success' => false,
                    'message' => 'Sesión no encontrada'
                ];
            }

            $sesion->update([
                'nombre' => $data['nombre'] ?? $sesion->nombre,
                'descripcion' => $data['descripcion'] ?? $sesion->descripcion,
                'orden' => $data['orden'] ?? $sesion->orden,
            ]);

            DB::commit();

            return [
                'success' => true,
                'data' => $sesion->load('archivos')
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error CursoSesionService@update: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al actualizar sesión: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Eliminar sesión
     */
    public function delete(int $sesionID): array
    {
        DB::beginTransaction();
        try {
            $sesion = CursoSesion::with('archivos')->find($sesionID);
            
            if (!$sesion) {
                return [
                    'success' => false,
                    'message' => 'Sesión no encontrada'
                ];
            }

            // Eliminar archivos físicos
            foreach ($sesion->archivos as $archivo) {
                if (\Storage::exists($archivo->ruta)) {
                    \Storage::delete($archivo->ruta);
                }
            }

            $sesion->delete();

            DB::commit();

            return [
                'success' => true,
                'message' => 'Sesión eliminada correctamente'
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error CursoSesionService@delete: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al eliminar sesión: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Reordenar sesiones
     */
    public function reordenar(int $cursoID, array $ordenSesiones): array
    {
        DB::beginTransaction();
        try {
            foreach ($ordenSesiones as $index => $sesionID) {
                CursoSesion::where('sesionID', $sesionID)
                    ->where('cursoID', $cursoID)
                    ->update(['orden' => $index + 1]);
            }

            DB::commit();

            return [
                'success' => true,
                'message' => 'Sesiones reordenadas correctamente'
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error CursoSesionService@reordenar: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al reordenar sesiones: ' . $e->getMessage()
            ];
        }
    }
}

