<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Rol; // Asumiendo que tu modelo se llama Rol
use Illuminate\Validation\Rule;
use App\Services\RoleService;
use App\Helpers\RoleHelper;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;

class RoleController extends Controller
{
    protected RoleService $roleService;

    public function __construct(RoleService $roleService)
    {
        // Se recomienda usar type-hinting en las propiedades (PHP 7.4+ o PHP 8)
        $this->roleService = $roleService;
    }

    /**
     * Obtener una lista de roles con sus permisos.
     */
    public function index()
    {
        try {
            // Usar un nombre de variable más explícito, aunque $roles está bien.
            $roles = Rol::with('permisos')->get(); 
            
            return response()->json([
                'status' => 'success',
                'data'   => $roles
            ], 200);

        } catch (\Throwable $e) {
            Log::error('Error RoleController@index: '.$e->getMessage(), ['exception' => $e]); // Mejorar el registro de log
            
            return response()->json([
                'status'  => 'error',
                'message' => 'Error al obtener la lista de roles',
                'debug'   => config('app.debug') ? $e->getMessage() : null // Usar config() en lugar de env()

            ], 500);

        }

    }

    

    /**

     * Crear un nuevo rol y asignar permisos opcionalmente.
     */
    public function store(Request $request)
    {
        try {
            // Log de entrada para debugging
            Log::info('RoleController@store - Datos recibidos:', [
                'nombreRol' => $request->input('nombreRol'),
                'permisos' => $request->input('permisos'),
                'all' => $request->all()
            ]);
            
            // La validación es correcta, pero la movemos fuera para capturar ValidationException
            $validatedData = $request->validate([
                // 'rol' debería ser el nombre de la tabla en minúscula.
                // Asumiendo que es 'rol' y la columna 'nombreRol'.
                'nombreRol'  => [
                    'required',
                    'string',
                    'max:50', // La columna es varchar(50) según la estructura
                    Rule::unique('rol', 'nombreRol')
                ], 
                'permisos'   => 'nullable|array', // Es buena práctica hacerlo "nullable" si es opcional.
                // Asumiendo tabla 'permiso' y columna 'permisoID'
                'permisos.*' => 'integer|exists:permiso,permisoID', 
            ]);

            // Se puede usar la data validada directamente
            $rol = Rol::create([
                'nombreRol' => $validatedData['nombreRol']
            ]);

            // Es mejor usar $rol->permisos()->sync() solo si hay permisos, ya lo tenías bien.
            if (!empty($validatedData['permisos'])) {
                $rol->permisos()->sync($validatedData['permisos']);
            }
            // Otra opción: $rol->permisos()->sync($validatedData['permisos'] ?? []);

            // Limpiar caché de roles después de crear un nuevo rol
            RoleHelper::clearRoleCache();

            return response()->json([
                'status'  => 'success',
                'message' => 'Rol creado correctamente',
                'data'    => $rol->load('permisos')
            ], 201);

        } catch (ValidationException $ve) {
            // Capturar ValidationException para un manejo de errores 422 más limpio
            Log::warning('Error de validación al crear rol: ' . json_encode($ve->errors()));
            return response()->json([
                'status'  => 'error',
                'message' => 'Validación fallida al crear el rol',
                'errors'  => $ve->errors()
            ], 422);

        } catch (\Throwable $e) {
            Log::error('Error RoleController@store: '.$e->getMessage(), ['exception' => $e]);
            
            return response()->json([
                'status'  => 'error',
                'message' => 'No se pudo crear el rol',
                'debug'   => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    
    
    /**
     * Obtener permisos de un rol específico por ID.
     */
    public function permisos($rolID)
    {
        // Esta lógica es buena y delega al servicio, lo que es una buena práctica.
        try {
            $result = $this->roleService->getPermisosByRol($rolID);

            if (!$result['success']) {
                // El RoleService debería manejar la excepción si el Rol no existe. 
                // Asumiendo que devuelve 'success' => false y un mensaje 404.
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 404);
            }

            return response()->json([
                'status'  => 'success',
                'message' => 'Permisos obtenidos correctamente',
                'data'    => $result['data']
            ], 200);

        } catch (\Throwable $e) {
            Log::error('Error RoleController@permisos: '.$e->getMessage(), ['exception' => $e]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener los permisos del rol',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    

    /**
     * Asignar o actualizar (sincronizar) permisos de un rol existente.
     */
    public function syncPermisos(Request $request, $rolID)
    {
        try {
            $validatedData = $request->validate([
                'permisos'   => 'required|array',
                'permisos.*' => 'integer|exists:permiso,permisoID',
            ]);

            // Es mejor capturar ModelNotFoundException antes que la genérica.
            $rol = Rol::findOrFail($rolID); 
            $rol->permisos()->sync($validatedData['permisos']); // Usar la data validada

            // Limpiar caché de roles después de actualizar permisos
            RoleHelper::clearRoleCache();

            return response()->json([
                'status'  => 'success',
                'message' => 'Permisos asignados correctamente',
                // Devolver el rol completo, o solo los permisos (como lo tenías),
                // pero la carga completa es más informativa en una API.
                'data'    => $rol->load('permisos')
            ], 200);

        } catch (ModelNotFoundException $mnfe) {
            // Manejar 404 si el rol no existe.
            return response()->json([
                'status'  => 'error',
                'message' => 'Rol no encontrado',
                'debug'   => config('app.debug') ? $mnfe->getMessage() : null
            ], 404);

        } catch (ValidationException $ve) {
            // Ya lo tenías correctamente separado.
            return response()->json([
                'status'  => 'error',
                'message' => 'Validación de permisos fallida',
                'errors'  => $ve->errors()
            ], 422);

        } catch (\Throwable $e) {
            Log::error('Error RoleController@syncPermisos: ' . $e->getMessage(), ['exception' => $e]);
            
            return response()->json([
                'status'  => 'error',
                'message' => 'Error al asignar permisos',
                'debug'   => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    

    /**
     * Actualizar el nombre del rol y/o sus permisos.
     */
    public function update(Request $request, $rolID)
    {
        try {
            // Capturar ModelNotFoundException primero.
            $rol = Rol::findOrFail($rolID); 

            $validatedData = $request->validate([
                'nombreRol' => [
                    'required',
                    'string',
                    'max:255',
                    // La regla de unicidad ignorando el ID actual es correcta.
                    Rule::unique('rol', 'nombreRol')->ignore($rolID) 
                ],
                'permisos'   => 'nullable|array', // Mejor "nullable"
                'permisos.*' => 'integer|exists:permiso,permisoID',
            ]);

            // Actualizar solo el nombre, que es requerido en la validación.
            $rol->update(['nombreRol' => $validatedData['nombreRol']]);

            // Sincronizar permisos solo si se enviaron en el payload.
            if (isset($validatedData['permisos'])) { 
                $rol->permisos()->sync($validatedData['permisos']);
            }

            // Limpiar caché de roles después de actualizar
            RoleHelper::clearRoleCache();

            return response()->json([
                'status'  => 'success',
                'message' => 'Rol actualizado correctamente',
                'data'    => $rol->load('permisos')
            ], 200);

        } catch (ModelNotFoundException $mnfe) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Rol no encontrado',
                'debug'   => config('app.debug') ? $mnfe->getMessage() : null
            ], 404);

        } catch (ValidationException $ve) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Validación fallida al actualizar el rol',
                'errors'  => $ve->errors()
            ], 422);

        } catch (\Throwable $e) {
            Log::error('Error RoleController@update: ' . $e->getMessage(), ['exception' => $e]);
            
            return response()->json([
                'status'  => 'error',
                'message' => 'No se pudo actualizar el rol',
                'debug'   => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    

    /**
     * Eliminar un rol.
     */
    public function destroy($rolID)
    {
        try {
            // Capturar ModelNotFoundException para 404
            $rol = Rol::findOrFail($rolID); 
            $rol->delete();

            // Limpiar caché de roles después de eliminar
            RoleHelper::clearRoleCache();

            return response()->json([
                'status'  => 'success',
                'message' => 'Rol eliminado correctamente'
            ], 200);

        } catch (ModelNotFoundException $mnfe) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Rol no encontrado',
                'debug'   => config('app.debug') ? $mnfe->getMessage() : null
            ], 404);

        } catch (\Throwable $e) {
            Log::error('Error RoleController@destroy: ' . $e->getMessage(), ['exception' => $e]);
            
            return response()->json([
                'status'  => 'error',
                'message' => 'No se pudo eliminar el rol',
                'debug'   => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}