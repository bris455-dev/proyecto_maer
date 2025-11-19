<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use App\DTOs\Seguridad\ChangeUserStatusDTO;
use App\Services\BitacoraService;

class UserStatusService
{
    protected BitacoraService $bitacoraService;

    public function __construct(BitacoraService $bitacoraService)
    {
        $this->bitacoraService = $bitacoraService;
    }

    /**
     * Cambia el estado de un usuario (activar/desactivar).
     */
    public function toggleEstado(ChangeUserStatusDTO $dto, string $ip): array
    {
        try {
            $user = User::find($dto->id);

            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'Usuario no encontrado.',
                ];
            }

            $estado = $dto->activar ? 0 : 1; // 0 = activo, 1 = desactivado
            $user->update(['is_locked' => $estado]);

            $action = $dto->activar ? 'activado' : 'desactivado';
            
            // Registrar en bitácora
            $this->bitacoraService->registrar(
                $user,
                'Cambio de estado',
                "Usuario {$user->email} {$action} por administrador.",
                $ip
            );

            return [
                'success' => true,
                'message' => "Usuario {$action} correctamente.",
                'estado' => $estado
            ];

        } catch (\Throwable $e) {
            Log::error("❌ Error al cambiar estado usuario ID {$dto->id}: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al cambiar el estado del usuario.',
            ];
        }
    }
}
