<?php

namespace App\DTOs\Cliente;

class ClienteDTO
{
    public string $nombre;
    public string $dni_ruc;
    public ?string $direccion;
    public ?string $pais;
    public ?string $email;
    public ?string $estado;

    public function __construct(array $data)
    {
        $this->nombre = $data['nombre'] ?? '';
        $this->dni_ruc = $data['dni_ruc'] ?? '';
        $this->direccion = $data['direccion'] ?? null;
        $this->pais = $data['pais'] ?? null;
        $this->email = $data['email'] ?? null;
        $this->estado = $data['estado'] ?? "1"; // 1 = Activo
    }

    public function toArray(): array
    {
        return [
            'nombre' => $this->nombre,
            'dni_ruc' => $this->dni_ruc,
            'direccion' => $this->direccion,
            'pais' => $this->pais,
            'email' => $this->email,
            'estado' => $this->estado,
        ];
    }
}
