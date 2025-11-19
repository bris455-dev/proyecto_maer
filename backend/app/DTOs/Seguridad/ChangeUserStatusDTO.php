<?php

namespace App\DTOs\Seguridad;

/**
 * DTO para encapsular el cambio de estado de un usuario.
 */
class ChangeUserStatusDTO
{
    public int $id;
    public bool $activar; // true = activo, false = desactivado

    public function __construct(array $data)
    {
        $this->id = (int) ($data['id'] ?? 0);
        $this->activar = filter_var($data['activar'] ?? false, FILTER_VALIDATE_BOOLEAN);
    }
}
