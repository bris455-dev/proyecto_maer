<?php

namespace App\DTOs\Reporte;

class ReporteDTO
{
    public string $tipo;
    public ?string $fecha_inicio;
    public ?string $fecha_fin;

    public function __construct(array $data)
    {
        $this->tipo = $data['tipo'] ?? 'general';
        $this->fecha_inicio = $data['fecha_inicio'] ?? null;
        $this->fecha_fin = $data['fecha_fin'] ?? null;
    }

    public function toArray(): array
    {
        return [
            'tipo' => $this->tipo,
            'fecha_inicio' => $this->fecha_inicio,
            'fecha_fin' => $this->fecha_fin,
        ];
    }
}
