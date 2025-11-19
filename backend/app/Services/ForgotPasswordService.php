<?php

namespace App\Services;

use App\Models\User;
use App\Mail\ResetPasswordCode;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ForgotPasswordService
{
    protected $bitacoraService;

    public function __construct(BitacoraService $bitacoraService)
    {
        $this->bitacoraService = $bitacoraService;
    }

    /**
     * ✅ Envía un código de 6 dígitos para restablecimiento de contraseña.
     */
    public function sendResetLink(string $email, string $ip): array
    {
        try {
            $user = User::where('email', $email)->first();

            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'No se encontró un usuario con ese correo electrónico.'
                ];
            }

            // Generar código de 6 dígitos
            $codigo = random_int(100000, 999999);

            // Guardar en BD
            $user->update([
                'password_reset_token' => $codigo,
                'password_reset_expires_at' => Carbon::now()->addMinutes(30),
            ]);

            // Enviar correo con clase Mailable
            Mail::to($user->email)->send(new ResetPasswordCode($codigo));

            // Registrar en bitácora
            $this->bitacoraService->registrar(
                $user,
                'solicitud_reset',
                'Se generó un código de restablecimiento y se envió al correo.',
                $ip
            );

            Log::info("🔑 Código de restablecimiento enviado a {$user->email}");

            return [
                'success' => true,
                'message' => 'Se ha enviado un código de recuperación a tu correo electrónico.'
            ];
        } catch (\Throwable $e) {
            Log::error("❌ Error al generar/enviar código de restablecimiento: " . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Error al procesar la solicitud de restablecimiento.'
            ];
        }
    }

    /**
     * ✅ Restablece la contraseña usando el código de 6 dígitos.
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
                    'message' => 'Código o correo inválido.'
                ];
            }

            if (!$user->password_reset_expires_at || Carbon::now()->greaterThan($user->password_reset_expires_at)) {
                return [
                    'success' => false,
                    'message' => 'El código de restablecimiento ha expirado.'
                ];
            }

            $user->update([
                'password' => Hash::make($data['new_password']),
                'password_changed' => true,
                'password_reset_token' => null,
                'password_reset_expires_at' => null,
            ]);

            // Registrar en bitácora
            $this->bitacoraService->registrar(
                $user,
                'password_reset',
                'Contraseña restablecida exitosamente.',
                $ip
            );

            Log::info("✅ Contraseña restablecida para {$user->email}");

            return [
                'success' => true,
                'message' => 'Tu contraseña ha sido restablecida correctamente.'
            ];
        } catch (\Throwable $e) {
            Log::error("❌ Error al restablecer contraseña: " . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Error al restablecer la contraseña.'
            ];
        }
    }
}
