<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Services\BitacoraService;

class MFAService
{
    protected $bitacoraService;

    public function __construct(BitacoraService $bitacoraService)
    {
        $this->bitacoraService = $bitacoraService;
    }

    /**
     * ✅ Genera un código MFA, lo guarda en la base y lo envía al correo del usuario.
     */
    public function generateAndSendCode(User $user, string $ip = null): array
    {
        try {
            // 🔹 Generar código aleatorio de 6 dígitos
            $code = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

            // 🔹 Guardar el código y su expiración
            $user->update([
                'mfa_code'        => $code,
                'mfa_expires_at'  => Carbon::now()->addMinutes(5),
            ]);

            // 🔹 Enviar correo con el código MFA
            Mail::raw("Tu código de verificación MFA es: {$code}", function ($message) use ($user) {
                $message->to($user->email)
                        ->subject('Código de verificación MFA - Plataforma MAER');
            });

            // 🔹 Registrar en bitácora
            $this->bitacoraService->registrar($user, 'Código MFA generado y enviado', 'Autenticación', $ip);

            Log::info("✅ Código MFA generado y enviado a: {$user->email}");

            return [
                'success' => true,
                'message' => 'Código MFA enviado correctamente al correo electrónico registrado.',
            ];
        } catch (\Throwable $e) {
            Log::error("❌ Error al generar/enviar código MFA: " . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Error al generar o enviar el código MFA.',
                'error'   => env('APP_DEBUG') ? $e->getMessage() : null,
            ];
        }
    }

    /**
     * ✅ Verifica si el código MFA ingresado es válido y no ha expirado.
     */
    public function verifyCode(User $user, string $mfa_code, string $ip = null): array
    {
        try {
            // 🔹 Verificar coincidencia del código
            if ($user->mfa_code !== $mfa_code) {
                $this->bitacoraService->registrar($user, 'Intento MFA incorrecto', 'Autenticación', $ip);

                return [
                    'success' => false,
                    'message' => 'El código MFA ingresado es incorrecto.',
                ];
            }

            // 🔹 Verificar expiración
            if (!$user->mfa_expires_at || Carbon::now()->gt($user->mfa_expires_at)) {
                $this->bitacoraService->registrar($user, 'Código MFA expirado', 'Autenticación', $ip);

                return [
                    'success' => false,
                    'message' => 'El código MFA ha expirado. Solicita uno nuevo.',
                ];
            }

            // 🔹 Limpiar código al validar correctamente
            $user->update([
                'mfa_code'        => null,
                'mfa_expires_at'  => null,
            ]);

            $this->bitacoraService->registrar($user, 'Código MFA verificado correctamente', 'Autenticación', $ip);
            Log::info("✅ MFA verificado para {$user->email}");

            return [
                'success' => true,
                'message' => 'MFA verificado correctamente.',
            ];
        } catch (\Throwable $e) {
            Log::error("❌ Error en MFAService@verifyCode: " . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Error al verificar el código MFA.',
                'error'   => env('APP_DEBUG') ? $e->getMessage() : null,
            ];
        }
    }
}
