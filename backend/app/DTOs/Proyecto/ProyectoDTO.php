<?php

namespace App\DTOs\Proyecto;

class ProyectoDTO
{
    public string $nombre;
    public ?string $numero_proyecto;
    public ?string $fecha_inicio;
    public ?string $fecha_fin;
    public ?string $fecha_entrega;
    public ?string $notas;
    public ?int $clienteID;
    public ?int $empleadoID;

    public function __construct(array $data)
    {
        $this->nombre = $data['nombre'] ?? '';
        $this->numero_proyecto = $data['numero_proyecto'] ?? null;
        $this->fecha_inicio = $data['fecha_inicio'] ?? null;
        $this->fecha_fin = $data['fecha_fin'] ?? null;
        $this->fecha_entrega = $data['fecha_entrega'] ?? null;
        $this->notas = $data['notas'] ?? null;
        $this->clienteID = isset($data['clienteID']) ? (int)$data['clienteID'] : null;
        $this->empleadoID = isset($data['empleadoID']) ? (int)$data['empleadoID'] : null;
    }

    public function toArray(): array
    {
        return [
            'nombre' => $this->nombre,
            'numero_proyecto' => $this->numero_proyecto,
            'fecha_inicio' => $this->fecha_inicio,
            'fecha_fin' => $this->fecha_fin,
            'fecha_entrega' => $this->fecha_entrega,
            'notas' => $this->notas,
            'clienteID' => $this->clienteID,
            'empleadoID' => $this->empleadoID,
        ];
    }
}
