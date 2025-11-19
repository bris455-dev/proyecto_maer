<?php

namespace App\DTOs\Auth;

/**
 * DTO utilizado para encapsular la solicitud inicial de restablecimiento
 * de contraseña (solo se requiere el correo electrónico).
 */
class ForgotPasswordRequestDTO
{
    public string $email;

    public function __construct(array $data)
    {
        $this->email = $data['email'] ?? '';
    }

    public function toArray(): array
    {
        return [
            'email' => $this->email,
        ];
    }
}