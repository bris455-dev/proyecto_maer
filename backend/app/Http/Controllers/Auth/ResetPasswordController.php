<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Bitacora;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB; // <-- Necesario para obtener permisos

class ResetPasswordController extends Controller
{
    public function resetPassword(Request $request)
    {
        try {
            // Validar entrada
            $request->validate([
                'email' => 'required|email',
                'token' => 'required|string',
                // El campo 'password_confirmation' es implícito gracias a 'confirmed'
                'password' => 'required|string|min:8|confirmed',
            ]);

            // Buscar el usuario por email
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No se encontró el usuario asociado al correo.'
                ], 404);
            }

            // Validar el token de reseteo
            if ($user->password_reset_token !== $request->token) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'El código de recuperación no es válido.'
                ], 400);
            }
            
            // 🔹 Validar que la nueva contraseña NO sea igual a la actual
            if (Hash::check($request->password, $user->password)) {
              return response()->json([
               'status' => 'error',
               'message' => 'La nueva contraseña no puede ser igual a la contraseña anterior.'
            ], 422);
            }
            
            // Opcional: Validar expiración del token aquí, si tienes lógica de tiempo
            // if (Carbon::parse($user->password_reset_expires_at)->isPast()) { ... }

            // 1. Actualizar contraseña
            $user->password = Hash::make($request->password);
            
            // 2. Limpiar/Eliminar el token usado
            $user->password_reset_token = null;
            $user->password_reset_expires_at = null;
            $user->save();

            // 3. Registrar acción en bitácora (Normalización de campos)
            Bitacora::create([
                'usuario_id' => $user->id, // Usamos usuario_id para consistencia
                'accion' => 'Restablecimiento de contraseña',
                'descripcion' => 'El usuario restableció su contraseña mediante el sistema de recuperación.', // Usamos descripcion
                'ip' => $request->ip(),
                'fecha_hora' => now(),
            ]);
            
            // 4. GENERAR TOKEN DE AUTENTICACIÓN PARA INICIAR SESIÓN AUTOMÁTICAMENTE
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

            // 5. Devolver la respuesta de éxito con el token y los datos del usuario (INCLUYE PERMISOS)
            return response()->json([
                'status' => 'success',
                'message' => 'Contraseña restablecida e inicio de sesión automático realizado.',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'nombre' => $user->nombre ?? null, 
                    'rolID' => $user->rolID,
                    'password_changed' => $user->password_changed, // <-- Añadido para consistencia
                    'permissions' => $permissions, // <-- AHORA INCLUIDO
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Error en ResetPasswordController@resetPassword: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Error interno del servidor al restablecer la contraseña.',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null
            ], 500);
        }
    }
}

