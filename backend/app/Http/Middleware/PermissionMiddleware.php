<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PermissionMiddleware
{
    /**
     * Verifica que el usuario tenga el permiso requerido para acceder a la ruta y realizar la acción.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  $permisoNombre  Nombre del módulo
     * @param  string|null  $accion  (Opcional) acción: 'crear', 'editar', 'listar', 'descargar', 'restablecer', etc.
     * @return mixed
     */
    public function handle(Request $request, Closure $next, string $permisoNombre, string $accion = null)
    {
        $user = $request->user();

        // Usuario no autenticado
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Usuario no autenticado.'
            ], 401);
        }

        // Usuario sin rol asignado
        if (!$user->rol) {
            return response()->json([
                'status' => 'error',
                'message' => 'El usuario no tiene un rol asignado.'
            ], 403);
        }

        $rolID = $user->rolID;

        // 🔹 Rol administrador (1): acceso completo salvo eliminar
        if ($rolID == 1) {
            if ($accion === 'eliminar') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No autorizado. La eliminación se maneja como desactivación.'
                ], 403);
            }
            return $next($request);
        }

        // 🔹 Rol diseñador (2)
        if ($rolID == 2) {
            $permisosDiseñador = [
                'Clientes' => ['editar'],
                'Proyectos' => ['crear', 'editar', 'listar'],
                'Reportes' => ['descargar'],
                'Seguridad' => ['restablecer']
            ];
            if (!isset($permisosDiseñador[$permisoNombre]) || ($accion && !in_array($accion, $permisosDiseñador[$permisoNombre]))) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No autorizado. Permiso insuficiente para diseñador.',
                    'rol_actual' => $user->rol->nombreRol,
                    'permiso_requerido' => $permisoNombre,
                    'accion_requerida' => $accion
                ], 403);
            }
            return $next($request);
        }

        // 🔹 Rol cliente (3)
        if ($rolID == 3) {
            $permisosCliente = [
                'Proyectos' => ['listar', 'editar_estado'],
                'Reportes' => ['descargar'],
                'Seguridad' => ['restablecer']
            ];
            if (!isset($permisosCliente[$permisoNombre]) || ($accion && !in_array($accion, $permisosCliente[$permisoNombre]))) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No autorizado. Permiso insuficiente para cliente.',
                    'rol_actual' => $user->rol->nombreRol,
                    'permiso_requerido' => $permisoNombre,
                    'accion_requerida' => $accion
                ], 403);
            }
            return $next($request);
        }

        // 🔹 Otros roles o sin permisos definidos
        return response()->json([
            'status' => 'error',
            'message' => 'Rol no autorizado o permisos no definidos.',
            'rol_actual' => $user->rol->nombreRol,
        ], 403);
    }
}
