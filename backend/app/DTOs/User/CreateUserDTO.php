<?php

namespace App\DTOs\User;

class CreateUserDTO
{
    // Usuario
    public string $tipo;
    public string $email;
    public int $rolID;

    // Empleado
    public ?string $empleado_nombre;
    public ?string $empleado_dni;
    public ?string $empleado_cargo;
    public ?string $empleado_estado;
    public ?string $empleado_email; // <- agregado

    // Cliente
    public ?string $cliente_nombre;
    public ?string $cliente_dni_ruc;
    public ?string $cliente_direccion;
    public ?string $cliente_pais;
    public ?string $cliente_email;
    public ?string $cliente_estado;
    public ?string $cliente_created_at;
    public ?string $cliente_updated_at;

    public function __construct(array $data)
    {
        // Usuario
        $this->tipo = $data['tipo'];
        $this->email = $data['email'];
        $this->rolID = (int) $data['rolID'];

        // Empleado
        $this->empleado_nombre = $data['nombre'] ?? null;
        $this->empleado_dni = $data['dni'] ?? null;
        $this->empleado_cargo = $data['cargo'] ?? null;
        $this->empleado_estado = $data['estado'] ?? '1';
        $this->empleado_email = $data['email'] ?? null; // <- agregado

        // Cliente
        $this->cliente_nombre = $data['nombre_cliente'] ?? null;
        $this->cliente_dni_ruc = $data['dni_ruc'] ?? null;
        $this->cliente_direccion = $data['direccion'] ?? null;
        $this->cliente_pais = $data['pais'] ?? null;
        $this->cliente_email = $data['email_cliente'] ?? $data['email'] ?? null;
        $this->cliente_estado = $data['estado_cliente'] ?? '1';
        $this->cliente_created_at = $data['created_at'] ?? null;
        $this->cliente_updated_at = $data['updated_at'] ?? null;
    }

    public function toArray(): array
    {
        return [
            'tipo' => $this->tipo,
            'email' => $this->email,
            'rolID' => $this->rolID,
            'empleado_nombre' => $this->empleado_nombre,
            'empleado_dni' => $this->empleado_dni,
            'empleado_cargo' => $this->empleado_cargo,
            'empleado_estado' => $this->empleado_estado,
            'empleado_email' => $this->empleado_email, // <- agregado
            'cliente_nombre' => $this->cliente_nombre,
            'cliente_dni_ruc' => $this->cliente_dni_ruc,
            'cliente_direccion' => $this->cliente_direccion,
            'cliente_pais' => $this->cliente_pais,
            'cliente_email' => $this->cliente_email,
            'cliente_estado' => $this->cliente_estado,
        ];
    }
}
