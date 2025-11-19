<?php

namespace App\DTOs\Auth;

/**
 * DTO utilizado para encapsular la data al verificar el código MFA
 * durante el proceso de login.
 */
class VerifyMfaDTO
{
    public string $email;
    public string $mfa_code;

    public function __construct(array $data)
    {
        // Se usa 'email' aquí ya que el AuthService@verifyMfaCode busca por email
        $this->email = $data['email'] ?? '';
        // El código en el servicio se llama $data['mfa_code']
        $this->mfa_code = $data['mfa_code'] ?? '';
    }

    public function toArray(): array
    {
        return [
            'email' => $this->email,
            'mfa_code' => $this->mfa_code,
        ];
    }
}