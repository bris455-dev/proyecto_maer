<?php

namespace App\Http\Controllers\Cursos;

use App\Http\Controllers\Controller;
use App\Services\Cursos\CursoMetadataService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CursoMetadataController extends Controller
{
    protected CursoMetadataService $metadataService;

    public function __construct(CursoMetadataService $metadataService)
    {
        $this->metadataService = $metadataService;
    }

    /**
     * Obtener todos los metadatos (Software, Aplicaciones, Niveles, Producción)
     */
    public function index(Request $request)
    {
        try {
            $metadata = $this->metadataService->getAllMetadata();

            return response()->json([
                'status' => 'success',
                'data' => $metadata
            ]);
        } catch (\Throwable $e) {
            Log::error("Error CursoMetadataController@index: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener metadatos'
            ], 500);
        }
    }

    /**
     * Crear nuevo software
     */
    public function createSoftware(Request $request)
    {
        try {
            $request->validate([
                'nombre' => 'required|string|max:255|unique:software,nombre'
            ]);

            $software = $this->metadataService->createSoftware($request->nombre);

            return response()->json([
                'status' => 'success',
                'data' => $software,
                'message' => 'Software creado exitosamente'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error CursoMetadataController@createSoftware: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al crear software'
            ], 500);
        }
    }

    /**
     * Crear nueva aplicación
     */
    public function createAplicacion(Request $request)
    {
        try {
            $request->validate([
                'nombre' => 'required|string|max:255|unique:aplicacion,nombre'
            ]);

            $aplicacion = $this->metadataService->createAplicacion($request->nombre);

            return response()->json([
                'status' => 'success',
                'data' => $aplicacion,
                'message' => 'Aplicación creada exitosamente'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error CursoMetadataController@createAplicacion: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al crear aplicación'
            ], 500);
        }
    }

    /**
     * Crear nuevo nivel
     */
    public function createNivel(Request $request)
    {
        try {
            $request->validate([
                'nombre' => 'required|string|max:255|unique:nivel,nombre'
            ]);

            $nivel = $this->metadataService->createNivel($request->nombre);

            return response()->json([
                'status' => 'success',
                'data' => $nivel,
                'message' => 'Nivel creado exitosamente'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error CursoMetadataController@createNivel: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al crear nivel'
            ], 500);
        }
    }

    /**
     * Crear nueva producción
     */
    public function createProduccion(Request $request)
    {
        try {
            $request->validate([
                'nombre' => 'required|string|max:255|unique:produccion,nombre'
            ]);

            $produccion = $this->metadataService->createProduccion($request->nombre);

            return response()->json([
                'status' => 'success',
                'data' => $produccion,
                'message' => 'Producción creada exitosamente'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error CursoMetadataController@createProduccion: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al crear producción'
            ], 500);
        }
    }

    /**
     * Actualizar software
     */
    public function updateSoftware(Request $request, $id)
    {
        try {
            $request->validate([
                'nombre' => 'required|string|max:255|unique:software,nombre,' . $id . ',id'
            ]);

            $software = $this->metadataService->updateSoftware($id, $request->nombre);

            return response()->json([
                'status' => 'success',
                'data' => $software,
                'message' => 'Software actualizado exitosamente'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error CursoMetadataController@updateSoftware: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar software'
            ], 500);
        }
    }

    /**
     * Actualizar aplicación
     */
    public function updateAplicacion(Request $request, $id)
    {
        try {
            $request->validate([
                'nombre' => 'required|string|max:255|unique:aplicacion,nombre,' . $id . ',id'
            ]);

            $aplicacion = $this->metadataService->updateAplicacion($id, $request->nombre);

            return response()->json([
                'status' => 'success',
                'data' => $aplicacion,
                'message' => 'Aplicación actualizada exitosamente'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error CursoMetadataController@updateAplicacion: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar aplicación'
            ], 500);
        }
    }

    /**
     * Actualizar nivel
     */
    public function updateNivel(Request $request, $id)
    {
        try {
            $request->validate([
                'nombre' => 'required|string|max:255|unique:nivel,nombre,' . $id . ',id'
            ]);

            $nivel = $this->metadataService->updateNivel($id, $request->nombre);

            return response()->json([
                'status' => 'success',
                'data' => $nivel,
                'message' => 'Nivel actualizado exitosamente'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error CursoMetadataController@updateNivel: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar nivel'
            ], 500);
        }
    }

    /**
     * Actualizar producción
     */
    public function updateProduccion(Request $request, $id)
    {
        try {
            $request->validate([
                'nombre' => 'required|string|max:255|unique:produccion,nombre,' . $id . ',id'
            ]);

            $produccion = $this->metadataService->updateProduccion($id, $request->nombre);

            return response()->json([
                'status' => 'success',
                'data' => $produccion,
                'message' => 'Producción actualizada exitosamente'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error CursoMetadataController@updateProduccion: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar producción'
            ], 500);
        }
    }

    /**
     * Eliminar software
     */
    public function deleteSoftware($id)
    {
        try {
            $this->metadataService->deleteSoftware($id);

            return response()->json([
                'status' => 'success',
                'message' => 'Software eliminado exitosamente'
            ]);
        } catch (\Throwable $e) {
            Log::error("Error CursoMetadataController@deleteSoftware: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al eliminar software'
            ], 500);
        }
    }

    /**
     * Eliminar aplicación
     */
    public function deleteAplicacion($id)
    {
        try {
            $this->metadataService->deleteAplicacion($id);

            return response()->json([
                'status' => 'success',
                'message' => 'Aplicación eliminada exitosamente'
            ]);
        } catch (\Throwable $e) {
            Log::error("Error CursoMetadataController@deleteAplicacion: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al eliminar aplicación'
            ], 500);
        }
    }

    /**
     * Eliminar nivel
     */
    public function deleteNivel($id)
    {
        try {
            $this->metadataService->deleteNivel($id);

            return response()->json([
                'status' => 'success',
                'message' => 'Nivel eliminado exitosamente'
            ]);
        } catch (\Throwable $e) {
            Log::error("Error CursoMetadataController@deleteNivel: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al eliminar nivel'
            ], 500);
        }
    }

    /**
     * Eliminar producción
     */
    public function deleteProduccion($id)
    {
        try {
            $this->metadataService->deleteProduccion($id);

            return response()->json([
                'status' => 'success',
                'message' => 'Producción eliminada exitosamente'
            ]);
        } catch (\Throwable $e) {
            Log::error("Error CursoMetadataController@deleteProduccion: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al eliminar producción'
            ], 500);
        }
    }
}

