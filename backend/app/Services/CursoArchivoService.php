<?php

namespace App\Services;

use App\Models\Curso;
use App\Models\CursoSesion;
use App\Models\CursoArchivo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CursoArchivoService
{
    /**
     * Tipos de archivo permitidos
     */
    private $tiposPermitidos = [
        'video' => ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
        'pdf' => ['pdf'],
        'ppt' => ['ppt', 'pptx'],
        'imagen' => ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        'zip' => ['zip'],
        'rar' => ['rar'],
    ];

    /**
     * Subir archivo
     */
    public function upload(int $cursoID, $file, ?int $sesionID = null): array
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

            if (!$file || !$file->isValid()) {
                return [
                    'success' => false,
                    'message' => 'Archivo inválido'
                ];
            }

            // Determinar tipo de archivo
            $extension = strtolower($file->getClientOriginalExtension());
            $tipo = $this->detectarTipo($extension);

            if (!$tipo) {
                return [
                    'success' => false,
                    'message' => 'Tipo de archivo no permitido'
                ];
            }

            // Generar nombre único
            $nombreOriginal = $file->getClientOriginalName();
            $nombreArchivo = time() . '_' . uniqid() . '.' . $extension;
            $ruta = "cursos/{$cursoID}/" . ($sesionID ? "sesion_{$sesionID}/" : '') . $nombreArchivo;

            // Guardar archivo
            Storage::disk('public')->put($ruta, file_get_contents($file->getRealPath()));

            // Obtener el siguiente orden
            $ultimoOrden = CursoArchivo::where('cursoID', $cursoID)
                ->where('sesionID', $sesionID)
                ->max('orden') ?? 0;

            // Crear registro
            $archivo = CursoArchivo::create([
                'cursoID' => $cursoID,
                'sesionID' => $sesionID,
                'nombre_original' => $nombreOriginal,
                'nombre_archivo' => $nombreArchivo,
                'ruta' => $ruta,
                'tipo' => $tipo,
                'mime_type' => $file->getMimeType(),
                'tamaño' => $file->getSize(),
                'orden' => $ultimoOrden + 1,
            ]);

            DB::commit();

            return [
                'success' => true,
                'data' => $archivo
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error CursoArchivoService@upload: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al subir archivo: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Subir múltiples archivos
     */
    public function uploadMultiple(int $cursoID, array $files, ?int $sesionID = null): array
    {
        $archivosSubidos = [];
        $errores = [];

        foreach ($files as $file) {
            $resultado = $this->upload($cursoID, $file, $sesionID);
            if ($resultado['success']) {
                $archivosSubidos[] = $resultado['data'];
            } else {
                $errores[] = $resultado['message'];
            }
        }

        return [
            'success' => count($archivosSubidos) > 0,
            'archivos' => $archivosSubidos,
            'errores' => $errores
        ];
    }

    /**
     * Eliminar archivo
     */
    public function delete(int $archivoID): array
    {
        DB::beginTransaction();
        try {
            $archivo = CursoArchivo::find($archivoID);
            
            if (!$archivo) {
                return [
                    'success' => false,
                    'message' => 'Archivo no encontrado'
                ];
            }

            // Eliminar archivo físico
            if (Storage::disk('public')->exists($archivo->ruta)) {
                Storage::disk('public')->delete($archivo->ruta);
            }

            $archivo->delete();

            DB::commit();

            return [
                'success' => true,
                'message' => 'Archivo eliminado correctamente'
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error CursoArchivoService@delete: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al eliminar archivo: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Detectar tipo de archivo por extensión
     */
    private function detectarTipo(string $extension): ?string
    {
        foreach ($this->tiposPermitidos as $tipo => $extensiones) {
            if (in_array($extension, $extensiones)) {
                return $tipo;
            }
        }
        return null;
    }
}

