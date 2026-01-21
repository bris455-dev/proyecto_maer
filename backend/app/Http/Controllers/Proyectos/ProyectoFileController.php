<?php

namespace App\Http\Controllers\Proyectos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Proyecto;
use App\Services\Proyectos\ProyectoFileService;
use App\Services\Proyectos\ProyectoImageService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ProyectoFileController extends Controller
{
    protected ProyectoFileService $fileService;
    protected ProyectoImageService $imageService;

    public function __construct(
        ProyectoFileService $fileService,
        ProyectoImageService $imageService
    ) {
        $this->fileService = $fileService;
        $this->imageService = $imageService;
    }

    /**
     * Subir imágenes/archivos a un proyecto
     */
    public function uploadImages(Request $request, $id)
    {
        try {
            $proyecto = Proyecto::find($id);
            if (!$proyecto) {
                return response()->json(['status'=>'error','message'=>'Proyecto no encontrado'], 404);
            }

            $user = $request->user();
            if (!$user) {
                return response()->json(['status'=>'error','message'=>'Usuario no autenticado'], 401);
            }

            // Obtener archivos
            $files = $request->file('images');
            if (!$files) {
                $files = $request->allFiles()['images'] ?? [];
            }
            
            if (!is_array($files)) {
                $files = [$files];
            }
            
            $files = array_filter($files, function($f) { return $f !== null; });
            
            if (empty($files)) {
                return response()->json(['status'=>'error','message'=>'No se proporcionaron archivos'], 400);
            }

            // Guardar archivos
            $archivosRutas = $this->fileService->guardarArchivosEnProyecto($proyecto->proyectoID, $files);
            
            if (empty($archivosRutas)) {
                return response()->json(['status'=>'error','message'=>'No se pudieron guardar los archivos'], 500);
            }

            // Registrar en proyecto_imagenes
            $this->imageService->registrarImagenes($proyecto->proyectoID, $archivosRutas);

            // Registrar en bitácora
            try {
                app()->make(\App\Services\BitacoraService::class)
                    ->registrar($user, 'Subida imágenes proyecto', "Proyecto {$proyecto->proyectoID}", $request->ip());
            } catch (\Throwable $e) {
                Log::warning("Error en bitácora (uploadImages): " . $e->getMessage());
            }

            return response()->json([
                'status'=>'success',
                'message'=>'Archivos subidos correctamente',
                'data'=>['archivos' => $archivosRutas]
            ]);
        } catch (\Throwable $e) {
            Log::error("Error ProyectoFileController@uploadImages: " . $e->getMessage());
            return response()->json(['status'=>'error','message'=>'Error al subir archivos'], 500);
        }
    }
}

