<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;

class UserListerService
{
    /**
     * Obtener una lista de todos los usuarios.
     */
    public function getAllUsers(): array
    {
        try {
            // Cargar la relación 'rol' para evitar problemas N+1
            return User::with('rol')->get()->toArray();
        } catch (\Throwable $e) {
            Log::error("❌ Error al obtener usuarios: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Obtener un usuario por su ID.
     */
    public function getUserById(int $id): ?User
    {
        try {
            return User::with('rol')->find($id);
        } catch (\Throwable $e) {
            Log::error("❌ Error al obtener usuario por ID {$id}: " . $e->getMessage());
            return null;
        }
    }
}
