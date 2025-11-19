<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class LogoutController extends Controller
{
    /**
     * Cerrar sesión del usuario autenticado y eliminar el token Sanctum actual.
     * Guarda el evento en la tabla "bitacora".
     */
    public function logout(Request $request)
    {
        try {
            $user = $request->user();

            // 🔹 Validar usuario autenticado
            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Usuario no autenticado o token inválido.'
                ], 401);
            }

            // 🔹 Eliminar solo el token actual (sin afectar otros dispositivos)
            $token = $user->currentAccessToken();
            if ($token) {
                $token->delete();
            }

            // 🔹 Registrar evento en tabla "bitacora"
            DB::table('bitacora')->insert([
                'user_id'   => $user->id,
                'accion'    => 'logout',
                'detalle'   => 'Cierre de sesión exitoso.',
                'ip'        => $request->ip(),
                'fecha_hora'=> now(), // formato DATETIME
            ]);

            // 🔹 Respuesta exitosa
            return response()->json([
                'status'  => 'success',
                'message' => 'Sesión cerrada correctamente.'
            ], 200);

        } catch (\Exception $e) {
            // 🔹 Registrar error en logs
            Log::error('Error al cerrar sesión: ' . $e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'Ocurrió un error al cerrar la sesión.',
                'error'   => env('APP_DEBUG') ? $e->getMessage() : null
            ], 500);
        }
    }
}

