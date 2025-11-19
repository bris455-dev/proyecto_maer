<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\PersonalAccessToken; // Asegurar la importación de Sanctum si se usa
use Carbon\Carbon;

// Asumiendo que BitacoraService existe
// use App\Services\BitacoraService; 

class AuthService
{
    // protected BitacoraService $bitacoraService; // Descomentar si BitacoraService está inyectado

    // public function __construct(BitacoraService $bitacoraService)
    // {
    //     $this->bitacoraService = $bitacoraService;
    // }
    
    // Dejo la inyección en comentario para evitar errores de clase no encontrada, ya que el servicio no fue proporcionado.
    public function __construct() 
    {
    }

    /**
     * ✅ Verifica el código MFA del usuario
     */
    public function verifyMfaCode(array $data, string $ip): array
    {
        try {
            $user = User::where('email', $data['email'])->first();

            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'Usuario no encontrado.',
                    'code'    => 404,
                ];
            }

            // 🔒 Verificar código MFA
            if ($user->mfa_code !== $data['mfa_code']) {
                // $this->bitacoraService->registrar($user, 'Código MFA incorrecto', 'Seguridad', $ip);

                return [
                    'success' => false,
                    'message' => 'Código MFA incorrecto.',
                    'code'    => 401,
                ];
            }

            // ⏳ Verificar expiración
            $now = Carbon::now();
            if ($user->mfa_expires_at && $now->greaterThan($user->mfa_expires_at)) {
                // $this->bitacoraService->registrar($user, 'Código MFA expirado', 'Seguridad', $ip);

                return [
                    'success' => false,
                    'message' => 'El código MFA ha expirado.',
                    'code'    => 401,
                ];
            }

            // ✅ Limpieza y generación de token exitosa
            $user->update([
                'mfa_code'        => null,
                'mfa_expires_at'  => null,
            ]);

            // Auth::login($user); // No es necesario si se usa Sanctum/Passport para API
            $token = $user->createToken('auth_token')->plainTextToken;

            // $this->bitacoraService->registrar($user, 'Inicio de sesión con MFA verificado', 'Seguridad', $ip);

            return [
                'success' => true,
                'message' => 'Inicio de sesión exitoso.',
                'user'    => [
                    'id'     => $user->id,
                    'nombre' => $user->nombre,
                    'email'  => $user->email,
                    'rolID'  => $user->rolID,
                ],
                'token'   => $token,
            ];

        } catch (\Throwable $e) {
            Log::error('Error en AuthService@verifyMfaCode: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Error al verificar el código MFA.',
                'error'   => env('APP_DEBUG') ? $e->getMessage() : null,
                'code'    => 500,
            ];
        }
    }

    /**
     * ✅ Cierra la sesión del usuario
     */
    public function logoutUser($user, string $ip): array
    {
        try {
            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'Usuario no autenticado.',
                ];
            }

            // Revocar token actual (Sanctum)
            if ($user->currentAccessToken()) {
                $user->currentAccessToken()->delete();
            }

            Auth::logout(); // Esto es para sesiones web, si es API solo el token es necesario.

            // $this->bitacoraService->registrar($user, 'Usuario cerró sesión correctamente', 'Seguridad', $ip);

            return [
                'success' => true,
                'message' => 'Sesión cerrada correctamente.',
            ];

        } catch (\Throwable $e) {
            Log::error('Error en AuthService@logoutUser: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Error al cerrar sesión.',
                'error'   => env('APP_DEBUG') ? $e->getMessage() : null,
            ];
        }
    }


    
}
