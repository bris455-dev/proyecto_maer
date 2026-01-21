<?php

namespace App\DTOs\User;

class CreateUserDTO
{
  // Para empleado
public ?string $empleado_nombre = null;
public ?string $empleado_dni = null;
public ?string $empleado_cargo = null;
public ?string $empleado_email = null;
public int $empleado_estado = 1;

// Para cliente
public ?string $cliente_nombre = null;
public ?string $cliente_dni_ruc = null;
public ?string $cliente_direccion = null;
public ?string $cliente_pais = null;
public ?string $cliente_email = null;
public int $cliente_estado = 1;

// Común
public string $email;
public int $rolID;
public string $tipo;


    public function __construct(array $data)
    {
        // Usuario
        $this->tipo = $data['tipo'];
        $this->email = $data['email'];
        $this->rolID = (int) $data['rolID'];

        // Empleado
        if (isset($data['empleado_nombre'])) {
            $this->empleado_nombre = $data['empleado_nombre'];
        } elseif (isset($data['nombre']) && $data['tipo'] === 'empleado') {
            $this->empleado_nombre = $data['nombre'];
        }
        
        if (isset($data['empleado_dni'])) {
            $this->empleado_dni = $data['empleado_dni'];
        } elseif (isset($data['dni']) && $data['tipo'] === 'empleado') {
            $this->empleado_dni = $data['dni'];
        }
        
        if (isset($data['empleado_cargo'])) {
            $this->empleado_cargo = $data['empleado_cargo'];
        } elseif (isset($data['cargo']) && $data['tipo'] === 'empleado') {
            $this->empleado_cargo = $data['cargo'];
        }
        
        $this->empleado_email = $data['email'] ?? null;
        $this->empleado_estado = isset($data['empleado_estado']) ? (int)$data['empleado_estado'] : 1;

        // Cliente
        if (isset($data['cliente_nombre'])) {
            $this->cliente_nombre = $data['cliente_nombre'];
        } elseif (isset($data['nombre_cliente']) && $data['tipo'] === 'cliente') {
            $this->cliente_nombre = $data['nombre_cliente'];
        }
        
        if (isset($data['cliente_dni_ruc'])) {
            $this->cliente_dni_ruc = $data['cliente_dni_ruc'];
        } elseif (isset($data['dni_ruc']) && $data['tipo'] === 'cliente') {
            $this->cliente_dni_ruc = $data['dni_ruc'];
        }
        
        if (isset($data['cliente_direccion'])) {
            $this->cliente_direccion = $data['cliente_direccion'];
        } elseif (isset($data['direccion']) && $data['tipo'] === 'cliente') {
            $this->cliente_direccion = $data['direccion'];
        }
        
        if (isset($data['cliente_pais'])) {
            $this->cliente_pais = $data['cliente_pais'];
        } elseif (isset($data['pais']) && $data['tipo'] === 'cliente') {
            $this->cliente_pais = $data['pais'];
        }
        
        $this->cliente_email = $data['email'] ?? null;
        $this->cliente_estado = isset($data['cliente_estado']) ? (int)$data['cliente_estado'] : 1;
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
