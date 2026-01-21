<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use App\Services\BitacoraService; // Asegúrate de tener esta línea si no estaba

class UserSecurityService
{
    // La contraseña genérica que deseas usar (CONSTANTE)
    const DEFAULT_ADMIN_RESET_PASSWORD = 'Maer1234$';

    protected BitacoraService $bitacoraService;

    public function __construct(BitacoraService $bitacoraService)
    {
        $this->bitacoraService = $bitacoraService;
    }

    /**
     * ✅ Restablece la contraseña de un usuario a la genérica y fuerza primer acceso
     */
    public function resetPasswordToGenericById(int $userID, string $adminIP): array
    {
        try {
            $user = User::findOrFail($userID);
            $genericPassword = self::DEFAULT_ADMIN_RESET_PASSWORD;

            $user->password = Hash::make($genericPassword);
            $user->password_changed = 0; // Forzar primer acceso
            $user->password_reset_token = null;
            $user->password_reset_expires_at = null;
            $user->save();

            // Registrar en bitácora
            $this->bitacoraService->registrar(
                $user,
                'Reseteo de contraseña por Admin',
                "Contraseña restablecida a '{$genericPassword}' y primer acceso forzado.",
                $adminIP
            );
            
            Log::info("🔑 Contraseña genérica establecida para usuario {$userID} por Admin.");

            return [
                'success' => true,
                'message' => "Contraseña restablecida correctamente a '{$genericPassword}'.",
                'user_id' => $user->id
            ];

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ['success' => false, 'message' => 'Usuario no encontrado.', 'code' => 404];
        } catch (\Throwable $e) {
            Log::error("❌ Error en resetPasswordToGenericById para ID {$userID}: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error interno al restablecer la contraseña.', 'code' => 500];
        }
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
            
            Log::info("✅ Contraseña actualizada para usuario {$user->id}");

            return ['success' => true, 'message' => 'Contraseña actualizada.'];

        } catch (\Throwable $e) {
            Log::error("❌ Error al cambiar contraseña del usuario {$user->id}: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al cambiar la contraseña.'];
        }
    }

    /**
     * ✅ Busca usuarios por nombre (lista) y registra la acción en bitácora.
     * @param string $name Nombre o parte del nombre a buscar.
     * @param User $admin El usuario que realiza la búsqueda (administrador).
     * @param string $ip La dirección IP del administrador.
     * @return \Illuminate\Support\Collection|array
     */
    public function searchUsersByName(string $name, User $admin, string $ip)
    {
        try {
            $users = User::where('nombre', 'LIKE', "%{$name}%")
                ->select('id', 'nombre', 'email', 'rolID', 'password_changed')
                ->orderBy('nombre')
                ->limit(20)
                ->get();

            // Registrar en bitácora
            $this->bitacoraService->registrar(
                $admin,
                'Búsqueda de usuarios',
                "El administrador {$admin->email} buscó usuarios con el término: '{$name}' y encontró {$users->count()} resultados.",
                $ip
            );

            Log::info("🔎 Admin {$admin->email} buscó usuarios: '{$name}'");
            
            return $users;
            
        } catch (\Throwable $e) {
            Log::error("❌ Error al buscar usuarios por nombre: " . $e->getMessage());
            // Si la búsqueda falla, devolvemos un array vacío para no exponer un 500
            return [];
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
 * 🚀 Crear usuario con contraseña temporal genérica (Maer1234$)
 */
/**
 * 🚀 Crear usuario con contraseña temporal fija (no se devuelve hasheada)
 */
public function crearUsuarioConPasswordFijo(array $data)
{
    try {
        $passwordTemporal = self::DEFAULT_ADMIN_RESET_PASSWORD; // Maer1234$

        $user = new User();
        $user->email = $data['email'];
        $user->rolID = $data['rolID'];
        $user->nombre = $data['nombre'] ?? 'Usuario Nuevo';
        $user->password = Hash::make($passwordTemporal); // se guarda encriptada
        $user->password_changed = 0;
        $user->save();

        Log::info("🟢 Usuario creado con contraseña temporal: {$user->email}");

        return [
            'success' => true,
            'message' => "Usuario creado correctamente.",
            'user_id' => $user->id,
            'password_temporal' => $passwordTemporal // ← se envía visible y NO hasheada
        ];

    } catch (\Throwable $e) {
        Log::error("❌ Error al crear usuario con password fijo: " . $e->getMessage());
        return ['success' => false, 'message' => 'Error interno al crear usuario.'];
    }
}


}