<?php

namespace App\DTOs\Reporte;

class ExportReporteDTO
{
    public ?string $fecha_inicio;
    public ?string $fecha_fin;
    public ?int $clienteID;
    public ?int $empleadoID;
    public ?string $tipo_pieza;

    public function __construct(array $data = [])
    {
        $this->fecha_inicio = !empty($data['fecha_inicio']) ? $data['fecha_inicio'] : null;
        $this->fecha_fin = !empty($data['fecha_fin']) ? $data['fecha_fin'] : null;
        $this->clienteID = !empty($data['clienteID']) ? (int)$data['clienteID'] : null;
        $this->empleadoID = !empty($data['empleadoID']) ? (int)$data['empleadoID'] : null;
        $this->tipo_pieza = !empty($data['tipo_pieza']) ? $data['tipo_pieza'] : null;
    }

    public function toArray(): array
    {
        return [
            'fecha_inicio' => $this->fecha_inicio,
            'fecha_fin' => $this->fecha_fin,
            'clienteID' => $this->clienteID,
            'empleadoID' => $this->empleadoID,
            'tipo_pieza' => $this->tipo_pieza,
        ];
    }
}

