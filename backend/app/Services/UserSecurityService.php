<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserSecurityService
{
    public BitacoraService $bitacoraService;

    public function __construct(BitacoraService $bitacoraService)
    {
        $this->bitacoraService = $bitacoraService;
    }

    /**
     * Cambiar contraseña del usuario autenticado
     */
    public function changePassword(User $user, string $newPassword, string $ip, int $primerAcceso = 1): array
    {
        try {
            $user->password = Hash::make($newPassword);
            $user->password_changed = $primerAcceso;
            $user->save();

            $this->bitacoraService->registrar(
                $user,
                'Cambio de contraseña',
                "El usuario {$user->email} cambió su contraseña.",
                $ip
            );

            return ['success' => true, 'message' => 'Contraseña actualizada.'];

        } catch (\Throwable $e) {
            Log::error("Error al cambiar contraseña del usuario {$user->id}: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al cambiar la contraseña.'];
        }
    }

    /**
     * Reset de contraseña a genérica
     */
    public function resetPasswordToDefault(User $user, string $ip): array
    {
        try {
            $user->password = Hash::make('12345678');
            $user->password_changed = 0;
            $user->save();

            $this->bitacoraService->registrar(
                $user,
                'Reset de contraseña',
                "La contraseña del usuario {$user->email} fue reseteada a la genérica.",
                $ip
            );

            return ['success' => true, 'message' => 'Contraseña restablecida correctamente.'];

        } catch (\Throwable $e) {
            Log::error("Error al resetear contraseña del usuario {$user->id}: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al resetear la contraseña.'];
        }
    }

    /**
     * Obtener usuario por correo
     */
    public function getUserByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    /**
     * Buscar usuarios por nombre (lista)
     */
    public function searchUsersByName(string $name)
    {
        return User::where('nombre', 'LIKE', "%{$name}%")
            ->select('id', 'nombre', 'email', 'rolID')
            ->orderBy('nombre')
            ->limit(20)
            ->get();
    }

    /**
     * Registrar búsqueda en bitácora
     */
    public function registrarBusqueda(User $admin, string $detalle, string $ip)
    {
        $this->bitacoraService->registrar(
            $admin,
            'Búsqueda de usuarios',
            $detalle,
            $ip
        );
    }
}
