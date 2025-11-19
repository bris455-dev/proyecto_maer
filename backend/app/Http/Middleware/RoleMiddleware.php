<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        // 🔹 Si no está autenticado → 401
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Usuario no autenticado.'
            ], 401);
        }

        // 🔹 Validar que el usuario tenga rol asignado
        if (!$user->rol) {
            return response()->json([
                'status' => 'error',
                'message' => 'El usuario no tiene un rol asignado.'
            ], 403);
        }

        // 🔹 Obtener nombre del rol
        $nombreRol = $user->rol->nombreRol;

        // 🔹 Verificar si su rol está permitido para la ruta
        if (!in_array($nombreRol, $roles)) {
            return response()->json([
                'status' => 'error',
                'message' => 'No autorizado. Rol insuficiente.',
                'rol_actual' => $nombreRol,
                'roles_permitidos' => $roles
            ], 403);
        }

        // 🔹 Permitir continuar
        return $next($request);
    }
}
