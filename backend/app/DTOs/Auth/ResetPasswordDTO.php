<?php

namespace App\DTOs\Auth;

class ResetPasswordDTO
{
    public string $email;
    public string $token;
    public string $new_password;

    public function __construct(array $data)
    {
        $this->email = $data['email'] ?? '';
        $this->token = $data['token'] ?? '';
        $this->new_password = $data['new_password'] ?? '';
    }

    public function toArray(): array
    {
        return [
            'email' => $this->email,
            'token' => $this->token,
            'new_password' => $this->new_password,
        ];
    }
}
