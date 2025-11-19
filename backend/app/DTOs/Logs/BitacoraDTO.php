<?php

namespace App\DTOs\Logs;

class BitacoraDTO
{
    public ?int $user_id;
    public string $accion;
    public string $descripcion;
    public ?string $ip;

    public function __construct(array $data)
    {
        $this->user_id = $data['user_id'] ?? null;
        $this->accion = $data['accion'] ?? '';
        $this->descripcion = $data['descripcion'] ?? '';
        $this->ip = $data['ip'] ?? null;
    }

    public function toArray(): array
    {
        return [
            'user_id' => $this->user_id,
            'accion' => $this->accion,
            'descripcion' => $this->descripcion,
            'ip' => $this->ip,
        ];
    }
}
