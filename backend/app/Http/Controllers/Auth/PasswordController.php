<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Bitacora;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB; // <-- Necesario para obtener permisos

class PasswordController extends Controller
{
    /**
     * ✅ Establece la contraseña inicial (primer acceso).
     * Actualiza el campo password, marca password_changed = 1 y genera token.
     */
    public function setInitialPassword(Request $request)
    {
        try {
            // 🔹 Validar campos
            $validated = $request->validate([
                'email' => 'required|email',
                'password_nuevo' => 'required|string|min:8|confirmed',
            ]);

            // 🔹 Buscar usuario
            $user = User::where('email', $validated['email'])->first();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Usuario no encontrado.'
                ], 404);
            }
            
            // 🔹 Validar que la nueva contraseña NO sea igual a la anterior
            if (Hash::check($validated['password_nuevo'], $user->password)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'La nueva contraseña no puede ser igual a la contraseña anterior.'
                ], 422);
            }

            // 🔹 Actualizar contraseña y marcar password_changed = 1
            $user->password = Hash::make($validated['password_nuevo']);
            $user->password_changed = 1;
            $user->save();

            // 🔹 Crear token de autenticación personal (Sanctum)
            $token = $user->createToken('auth_token')->plainTextToken;

            // 🔑 Obtener permisos del usuario
            $permisos = DB::table('rolpermiso as rp')
                ->join('permiso as p', 'rp.permisoID', '=', 'p.permisoID')
                ->where('rp.rolID', $user->rolID)
                ->select('p.nombreModulo', 'p.nombreSubmodulo')
                ->get();

            $permissions = $permisos->map(fn($p) => [
                'nombreModulo'      => $p->nombreModulo,
                'nombreSubmodulo'   => $p->nombreSubmodulo
            ])->toArray();
            
            // 🔹 Registrar en logs
            Log::info("Primer acceso completado por {$user->email}");

            // 🔹 Devolver respuesta con token y datos del usuario (INCLUYE PERMISOS)
            return response()->json([
                'status'  => 'success',
                'message' => 'Contraseña cambiada correctamente. Bienvenido al sistema.',
                'user'    => [
                    'id'               => $user->id,
                    'nombre'           => $user->nombre,
                    'email'            => $user->email,
                    'rolID'            => $user->rolID,
                    'password_changed' => $user->password_changed,
                    'permissions'      => $permissions, // <-- AHORA INCLUIDO
                ],
                'token'   => $token,
            ], 200);

        } catch (\Throwable $e) {
            Log::error('Error en PasswordController@setInitialPassword: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'Error interno al establecer la contraseña.',
                'error'   => env('APP_DEBUG') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
