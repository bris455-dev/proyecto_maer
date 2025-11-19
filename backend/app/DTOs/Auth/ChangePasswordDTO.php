<?php

namespace App\DTOs\Auth;

class ChangePasswordDTO
{
    public int $userId; // corresponde al 'id' de la tabla usuarios
    public string $currentPassword; // valor ingresado por el usuario para validar
    public string $newPassword;     // valor ingresado por el usuario para actualizar

    public function __construct(array $data)
    {
        $this->userId = (int) ($data['user_id'] ?? 0);
        $this->currentPassword = trim($data['current_password'] ?? '');
        $this->newPassword = trim($data['new_password'] ?? '');
    }

    public function toArray(): array
    {
        return [
            'user_id' => $this->userId,
            'current_password' => $this->currentPassword,
            'new_password' => $this->newPassword,
        ];
    }
}
