<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\RoleService;
use Illuminate\Support\Facades\Log;

class RoleController extends Controller
{
    protected $roleService;

    public function __construct(RoleService $roleService)
    {
        $this->roleService = $roleService;
    }

    /**
     * ✅ Listar todos los roles disponibles
     */
    public function index()
    {
        try {
            $roles = $this->roleService->getAllRoles();

            return response()->json([
                'status' => 'success',
                'message' => 'Lista de roles obtenida correctamente.',
                'data' => $roles
            ], 200);

        } catch (\Throwable $e) {
            Log::error('Error en RoleController@index: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener la lista de roles.',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * ✅ Crear un nuevo rol
     */
    public function store(Request $request)
    {
        try {
            // 🔹 Validar datos usando el nombre correcto de columna
            $validated = $request->validate([
                'nombreRol'   => 'required|string|max:100|unique:rol,nombreRol',
                'descripcion' => 'nullable|string|max:255',
            ]);

            // 🔹 Delegar al servicio
            $result = $this->roleService->createRole($validated, $request->ip());

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Rol creado correctamente.',
                'data' => $result['role']
            ], 201);

        } catch (\Throwable $e) {
            Log::error('Error en RoleController@store: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Error al crear el rol.',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * ✅ Obtener permisos de un rol
     */
    public function permisos($rolID)
    {
        try {
            // 🔹 Usar el método que trae los permisos vía la relación del modelo
            $permisos = $this->roleService->getPermisosByRol($rolID);

            return response()->json([
                'status' => 'success',
                'message' => 'Permisos obtenidos correctamente.',
                'data' => $permisos
            ], 200);

        } catch (\Throwable $e) {
            Log::error('Error en RoleController@permisos: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'No se pudieron obtener los permisos del rol.',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null
            ], 500);
        }
    }
}
