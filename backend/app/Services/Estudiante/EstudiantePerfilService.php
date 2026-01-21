<?php

namespace App\Services\Estudiante;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class EstudiantePerfilService
{
    /**
     * Actualizar información del perfil
     */
    public function updatePerfil(int $userId, array $data): array
    {
        try {
            DB::beginTransaction();

            $user = User::findOrFail($userId);

            if (isset($data['nombre'])) {
                $user->nombre = $data['nombre'];
            }

            if (isset($data['idioma'])) {
                $user->idioma = $data['idioma'];
            }

            if (isset($data['tema'])) {
                $user->tema = $data['tema'];
            }

            $user->save();

            DB::commit();

            // Recargar el usuario con todas sus relaciones
            $user->refresh();

            return [
                'success' => true,
                'message' => 'Perfil actualizado correctamente',
                'user' => $user
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("EstudiantePerfilService@updatePerfil: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al actualizar el perfil: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Cambiar contraseña del estudiante
     */
    public function cambiarContrasena(int $userId, string $nuevaPassword): array
    {
        try {
            DB::beginTransaction();

            $user = User::findOrFail($userId);
            $user->password = Hash::make($nuevaPassword);
            $user->password_changed = 1;
            $user->save();

            DB::commit();

            return [
                'success' => true,
                'message' => 'Contraseña actualizada correctamente'
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("EstudiantePerfilService@cambiarContrasena: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al cambiar la contraseña: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Actualizar preferencias de notificaciones
     */
    public function updateNotificaciones(int $userId, array $data): array
    {
        try {
            DB::beginTransaction();

            $user = User::findOrFail($userId);

            if (isset($data['notificaciones_email'])) {
                $user->notificaciones_email = $data['notificaciones_email'];
            }

            if (isset($data['notificaciones_nuevos_cursos'])) {
                $user->notificaciones_nuevos_cursos = $data['notificaciones_nuevos_cursos'];
            }

            if (isset($data['notificaciones_recordatorios'])) {
                $user->notificaciones_recordatorios = $data['notificaciones_recordatorios'];
            }

            $user->save();

            DB::commit();

            // Recargar el usuario
            $user->refresh();

            return [
                'success' => true,
                'message' => 'Preferencias de notificaciones actualizadas correctamente',
                'user' => $user
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("EstudiantePerfilService@updateNotificaciones: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al actualizar las preferencias: ' . $e->getMessage()
            ];
        }
    }
}

