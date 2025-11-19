<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use App\Services\BitacoraService;

class UserUpdaterService
{
    protected BitacoraService $bitacoraService;

    public function __construct(BitacoraService $bitacoraService)
    {
        $this->bitacoraService = $bitacoraService;
    }

    /**
     * Actualiza los datos de un usuario por su ID.
     */
    public function update(int $id, array $data, string $ip): array
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'Usuario no encontrado para actualizar.',
                ];
            }

            // Filtrar solo los campos permitidos y presentes
            $allowedFields = ['nombre', 'email', 'rolID', 'is_locked'];
            $updateFields = array_intersect_key(
                array_filter($data, fn ($value) => !is_null($value)),
                array_flip($allowedFields)
            );

            if (empty($updateFields)) {
                return [
                    'success' => true,
                    'message' => 'No se proporcionaron datos para actualizar.',
                    'data' => $user->fresh(),
                ];
            }

            $user->update($updateFields);

            // ✍ Registrar en bitácora
            $this->bitacoraService->registrar(
                $user,
                'Actualización de usuario',
                "Usuario {$user->email} actualizado. Campos: " . implode(', ', array_keys($updateFields)),
                $ip
            );

            return [
                'success' => true,
                'message' => 'Usuario actualizado correctamente.',
                'data'    => $user->fresh(),
            ];

        } catch (\Throwable $e) {
            Log::error("❌ Error al actualizar usuario ID {$id}: " . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Error al actualizar el usuario.',
            ];
        }
    }
}
