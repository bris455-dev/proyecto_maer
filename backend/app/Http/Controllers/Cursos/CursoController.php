<?php

namespace App\Http\Controllers\Cursos;

use App\Http\Controllers\Controller;
use App\Services\CursoService;
use App\Services\CursoSesionService;
use App\Services\CursoArchivoService;
use App\Helpers\RoleHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CursoController extends Controller
{
    protected CursoService $cursoService;
    protected CursoSesionService $sesionService;
    protected CursoArchivoService $archivoService;

    public function __construct(
        CursoService $cursoService,
        CursoSesionService $sesionService,
        CursoArchivoService $archivoService
    ) {
        $this->cursoService = $cursoService;
        $this->sesionService = $sesionService;
        $this->archivoService = $archivoService;
    }

    /**
     * Listar cursos
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $filters = $request->only([
                'nivel', 
                'nivel_id',
                'estado', 
                'busqueda',
                'software_id',
                'aplicacion_id',
                'produccion_id',
                'gratis',
                'precio_min',
                'precio_max'
            ]);
            
            // Convertir 'gratis' de string a boolean si viene como 'true'/'false'
            if (isset($filters['gratis'])) {
                $filters['gratis'] = filter_var($filters['gratis'], FILTER_VALIDATE_BOOLEAN);
            }
            
            $cursos = $this->cursoService->listForUser($user, $filters);

            return response()->json([
                'status' => 'success',
                'data' => $cursos
            ]);
        } catch (\Throwable $e) {
            Log::error("Error CursoController@index: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener cursos'
            ], 500);
        }
    }

    /**
     * Obtener curso por ID
     */
    public function show(Request $request, $id)
    {
        try {
            $user = $request->user();
            $curso = $this->cursoService->getById($id, $user);

            if (!$curso) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Curso no encontrado o sin permisos'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => $curso
            ]);
        } catch (\Throwable $e) {
            Log::error("Error CursoController@show: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener curso'
            ], 500);
        }
    }

    /**
     * Crear curso (solo administradores)
     */
    public function store(Request $request)
    {
        try {
            $user = $request->user();
            
            // Solo administradores pueden crear cursos
            if (!RoleHelper::isAdmin($user)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No autorizado. Solo los administradores pueden crear cursos.'
                ], 403);
            }

            $validated = $request->validate([
                'nombre' => 'required|string|max:200',
                'descripcion' => 'nullable|string',
                'nivel' => 'required|in:Básico,Intermedio,Avanzado',
                'cantidad_horas' => 'nullable|integer|min:0',
                'precio' => 'nullable|numeric|min:0',
                'objetivos' => 'nullable|string',
                'requisitos' => 'nullable|string',
                'estado' => 'nullable|in:Borrador,Publicado,Archivado',
            ]);

            $result = $this->cursoService->create($validated, $user);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Curso creado correctamente',
                'data' => $result['data']
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error CursoController@store: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al crear curso'
            ], 500);
        }
    }

    /**
     * Actualizar curso (solo administradores)
     */
    public function update(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            // Solo administradores pueden actualizar cursos
            if (!RoleHelper::isAdmin($user)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No autorizado. Solo los administradores pueden editar cursos.'
                ], 403);
            }

            $validated = $request->validate([
                'nombre' => 'sometimes|string|max:200',
                'descripcion' => 'nullable|string',
                'nivel' => 'sometimes|in:Básico,Intermedio,Avanzado',
                'cantidad_horas' => 'nullable|integer|min:0',
                'precio' => 'nullable|numeric|min:0',
                'objetivos' => 'nullable|string',
                'requisitos' => 'nullable|string',
                'estado' => 'nullable|in:Borrador,Publicado,Archivado',
            ]);

            $result = $this->cursoService->update($id, $validated, $user);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Curso actualizado correctamente',
                'data' => $result['data']
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error CursoController@update: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar curso'
            ], 500);
        }
    }

    /**
     * Eliminar curso (solo administradores)
     */
    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            // Solo administradores pueden eliminar cursos
            if (!RoleHelper::isAdmin($user)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No autorizado. Solo los administradores pueden eliminar cursos.'
                ], 403);
            }

            $result = $this->cursoService->delete($id);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => $result['message']
            ]);
        } catch (\Throwable $e) {
            Log::error("Error CursoController@destroy: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al eliminar curso'
            ], 500);
        }
    }

    /**
     * Crear sesión (solo administradores)
     */
    public function crearSesion(Request $request, $cursoID)
    {
        try {
            $user = $request->user();
            
            // Solo administradores pueden crear sesiones
            if (!RoleHelper::isAdmin($user)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No autorizado. Solo los administradores pueden crear sesiones.'
                ], 403);
            }

            $validated = $request->validate([
                'nombre' => 'required|string|max:200',
                'descripcion' => 'nullable|string',
            ]);

            $result = $this->sesionService->create($cursoID, $validated);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Sesión creada correctamente',
                'data' => $result['data']
            ], 201);
        } catch (\Throwable $e) {
            Log::error("Error CursoController@crearSesion: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al crear sesión'
            ], 500);
        }
    }

    /**
     * Subir archivos a curso/sesión (solo administradores)
     */
    public function subirArchivos(Request $request, $cursoID)
    {
        try {
            $user = $request->user();
            
            // Solo administradores pueden subir archivos
            if (!RoleHelper::isAdmin($user)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No autorizado. Solo los administradores pueden subir archivos.'
                ], 403);
            }

            $request->validate([
                'archivos' => 'required|array',
                'archivos.*' => 'file|max:102400', // 100MB máximo
                'sesionID' => 'nullable|integer|exists:curso_sesiones,sesionID',
            ]);

            $archivos = $request->file('archivos');
            $sesionID = $request->input('sesionID');

            $result = $this->archivoService->uploadMultiple($cursoID, $archivos, $sesionID);

            return response()->json([
                'status' => $result['success'] ? 'success' : 'partial',
                'message' => $result['success'] ? 'Archivos subidos correctamente' : 'Algunos archivos no se pudieron subir',
                'data' => $result['archivos'],
                'errores' => $result['errores'] ?? []
            ], $result['success'] ? 201 : 207);
        } catch (\Throwable $e) {
            Log::error("Error CursoController@subirArchivos: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al subir archivos'
            ], 500);
        }
    }

    /**
     * Eliminar archivo (solo administradores)
     */
    public function eliminarArchivo(Request $request, $cursoID, $archivoID)
    {
        try {
            $user = $request->user();
            
            // Solo administradores pueden eliminar archivos
            if (!RoleHelper::isAdmin($user)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No autorizado. Solo los administradores pueden eliminar archivos.'
                ], 403);
            }

            $result = $this->archivoService->delete($archivoID);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => $result['message']
            ]);
        } catch (\Throwable $e) {
            Log::error("Error CursoController@eliminarArchivo: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al eliminar archivo'
            ], 500);
        }
    }
}

