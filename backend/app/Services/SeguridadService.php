<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SeguridadService
{
    protected $bitacoraService;
    protected int $maxAttempts = 3; // Máximos intentos permitidos

    public function __construct(BitacoraService $bitacoraService)
    {
        $this->bitacoraService = $bitacoraService;
    }

    /**
     * Incrementa intentos fallidos y bloquea usuario si alcanza el máximo
     */
    public function registerFailedAttempt(User $user, string $ip = null): array
    {
        try {
            $user->failed_attempts = ($user->failed_attempts ?? 0) + 1;

            if ($user->failed_attempts >= $this->maxAttempts) {
                $user->is_locked = 1;
                $user->lock_expires_at = Carbon::now();
                
                $this->bitacoraService->registrar(
                    $user,
                    'Usuario bloqueado por intentos fallidos',
                    'Seguridad',
                    $ip
                );

                Log::warning("🚫 Usuario bloqueado: {$user->email}");
            }

            $user->save();

            return [
                'success' => true,
                'attempts' => $user->failed_attempts,
                'is_locked' => $user->is_locked,
                'message' => $user->is_locked
                    ? 'Usuario bloqueado tras varios intentos fallidos.'
                    : 'Intento fallido registrado.'
            ];

        } catch (\Throwable $e) {
            Log::error("❌ Error en SeguridadService@registerFailedAttempt: " . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Error al registrar intento fallido.',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null,
            ];
        }
    }

    /**
     * Reinicia los intentos fallidos al iniciar sesión correctamente
     */
    public function resetFailedAttempts(User $user): void
    {
        $user->update([
            'failed_attempts' => 0,
            'is_locked' => 0,
            'lock_expires_at' => null,
        ]);

        $this->bitacoraService->registrar(
            $user,
            'Intentos fallidos reiniciados tras login correcto',
            'Seguridad'
        );
    }

    /**
     * Desbloquea manualmente un usuario
     */
    public function unlockUser(User $user, string $ip = null): array
    {
        try {
            $user->update([
                'is_locked' => 0,
                'lock_expires_at' => null,
                'failed_attempts' => 0,
            ]);

            $this->bitacoraService->registrar(
                $user,
                'Usuario desbloqueado manualmente',
                'Seguridad',
                $ip
            );

            Log::info("✅ Usuario desbloqueado: {$user->email}");

            return [
                'success' => true,
                'message' => 'Usuario desbloqueado correctamente.',
            ];

        } catch (\Throwable $e) {
            Log::error("❌ Error en SeguridadService@unlockUser: " . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Error al desbloquear el usuario.',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null,
            ];
        }
    }
}
