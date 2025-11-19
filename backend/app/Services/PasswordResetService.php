<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PasswordResetService
{
    protected $bitacoraService;

    public function __construct(BitacoraService $bitacoraService)
    {
        $this->bitacoraService = $bitacoraService;
    }

    /**
     * ✅ Enviar un token/código de recuperación de contraseña al correo del usuario.
     */
    public function sendResetToken(array $data, string $ip): array
    {
        try {
            $user = User::where('email', $data['email'])->first();

            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'No existe un usuario con ese correo.',
                    'code' => 404
                ];
            }

            $token = Str::random(64);
            $expiresAt = Carbon::now()->addMinutes(30);

            // Guardar en la tabla password_resets (para trazabilidad)
            DB::table('password_resets')->updateOrInsert(
                ['email' => $user->email],
                [
                    'token' => Hash::make($token), // se guarda hasheado
                    'created_at' => now(),
                ]
            );

            // También guardamos en el usuario para control interno
            $user->update([
                'password_reset_token' => $token,
                'password_reset_expires_at' => $expiresAt,
            ]);

            // Enviar correo simple
            $body = "Hola {$user->nombre},\n\n"
                . "Has solicitado restablecer tu contraseña.\n\n"
                . "Tu código de recuperación es:\n{$token}\n\n"
                . "Este código expirará en 30 minutos.\n\n"
                . "Si no solicitaste este cambio, ignora este mensaje.";

            Mail::raw($body, function ($message) use ($user) {
                $message->to($user->email)
                        ->subject('Recuperación de contraseña - Plataforma MAER');
            });

            // Registrar en bitácora
            $this->bitacoraService->registrar(
                $user,
                'Solicitud de recuperación de contraseña',
                'Se envió un token de recuperación al correo del usuario.',
                $ip
            );

            return [
                'success' => true,
                'message' => 'El código de recuperación se envió correctamente a tu correo.'
            ];
        } catch (\Throwable $e) {
            Log::error("❌ Error en sendResetToken: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Ocurrió un error al enviar el correo de recuperación.',
                'code' => 500
            ];
        }
    }

    /**
     * ✅ Restablecer la contraseña usando el token de recuperación.
     */
    public function resetPassword(array $data, string $ip): array
    {
        try {
            $user = User::where('email', $data['email'])
                        ->where('password_reset_token', $data['token'])
                        ->first();

            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'El token o correo ingresado no es válido.',
                    'code' => 404
                ];
            }

            if (Carbon::now()->greaterThan($user->password_reset_expires_at)) {
                return [
                    'success' => false,
                    'message' => 'El token ha expirado, solicita uno nuevo.',
                    'code' => 410
                ];
            }

            // Actualizar contraseña y limpiar token
            $user->password = Hash::make($data['new_password']);
            $user->password_changed = true;
            $user->password_reset_token = null;
            $user->password_reset_expires_at = null;
            $user->save();

            // Eliminar token de la tabla password_resets
            DB::table('password_resets')->where('email', $user->email)->delete();

            // Registrar en bitácora
            $this->bitacoraService->registrar(
                $user,
                'Restablecimiento de contraseña',
                'El usuario restableció su contraseña mediante token.',
                $ip
            );

            return [
                'success' => true,
                'message' => 'Contraseña restablecida correctamente.',
                'user' => [
                    'id' => $user->id,
                    'nombre' => $user->nombre,
                    'email' => $user->email
                ]
            ];
        } catch (\Throwable $e) {
            Log::error("❌ Error en resetPassword: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al restablecer la contraseña.',
                'code' => 500
            ];
        }
    }
}
