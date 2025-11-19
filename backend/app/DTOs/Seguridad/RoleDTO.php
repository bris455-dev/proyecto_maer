<?php

namespace App\DTOs\Seguridad;

class RoleDTO
{
    public int $id;
    public int $rolID;

    public function __construct(array $data)
    {
        $this->id = (int) ($data['id'] ?? 0);
        $this->rolID = (int) ($data['rolID'] ?? 0);
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'rolID' => $this->rolID,
        ];
    }
}
