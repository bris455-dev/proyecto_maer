<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Helpers\RoleHelper;

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
        Log::info("🔐 PermissionMiddleware - Verificando permiso: {$permisoNombre}, acción: " . ($accion ?? 'null'));
        Log::info("🔐 Request URI: " . $request->getRequestUri());
        Log::info("🔐 Request method: " . $request->method());
        
        $user = $request->user();
        Log::info("🔐 User ID: " . ($user ? $user->id : 'NO AUTENTICADO'));

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

        // 🔹 Rol administrador: acceso completo a todo
        // Usar RoleHelper para verificar si es administrador
        if (RoleHelper::isAdmin($user)) {
            Log::info("🔐 PermissionMiddleware - Administrador autorizado (acceso completo)");
            return $next($request);
        }

        $rolID = $user->rolID;

        // 🔹 Para todos los demás roles: verificar permisos desde la base de datos
        // Buscar el permiso en la base de datos
        $permiso = DB::table('permiso')
            ->where('nombreModulo', $permisoNombre)
            ->when($accion, function($query) use ($accion) {
                // Si hay acción, buscar por nombreSubmodulo que coincida con la acción
                return $query->where('nombreSubmodulo', $accion);
            })
            ->first();

        if (!$permiso) {
            Log::warning("🔐 PermissionMiddleware - Permiso no encontrado en BD: {$permisoNombre}, acción: " . ($accion ?? 'null'));
            return response()->json([
                'status' => 'error',
                'message' => 'Permiso no encontrado en el sistema.',
                'rol_actual' => $user->rol->nombreRol,
                'permiso_requerido' => $permisoNombre,
                'accion_requerida' => $accion
            ], 403);
        }

        // Verificar si el rol tiene este permiso asignado
        $tienePermiso = DB::table('rolpermiso')
            ->where('rolID', $rolID)
            ->where('permisoID', $permiso->permisoID)
            ->exists();

        if (!$tienePermiso) {
            Log::warning("🔐 PermissionMiddleware - Rol {$rolID} ({$user->rol->nombreRol}) NO tiene permiso: {$permisoNombre}, acción: " . ($accion ?? 'null'));
            return response()->json([
                'status' => 'error',
                'message' => 'No autorizado. Permiso insuficiente.',
                'rol_actual' => $user->rol->nombreRol,
                'permiso_requerido' => $permisoNombre,
                'accion_requerida' => $accion
            ], 403);
        }

        Log::info("🔐 PermissionMiddleware - Rol {$rolID} ({$user->rol->nombreRol}) autorizado para: {$permisoNombre}, acción: " . ($accion ?? 'null'));
        return $next($request);
    }
}
