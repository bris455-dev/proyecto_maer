<?php

namespace App\Services\Proyectos;

use App\Models\Proyecto;
use App\Models\Tratamiento;
use App\Models\ProyectoDetalle;
use Illuminate\Support\Facades\Log;

class ProyectoDetalleService
{
    /**
     * Crear detalles del proyecto
     */
    public function crearDetalles(Proyecto $proyecto, array $detalles): void
    {
        foreach ($detalles as $d) {
            $pieza = $d['pieza'] ?? null;
            $tratamientoID = $d['tratamientoID'] ?? null;
            
            if (!$pieza || !$tratamientoID) {
                continue;
            }
            
            $tModel = Tratamiento::find($tratamientoID);
            if (!$tModel) {
                Log::warning("Tratamiento ID {$tratamientoID} no encontrado, usando precio por defecto");
            }
            
            $nombreTratamiento = $tModel ? strtolower($tModel->nombre) : '';
            $precio = ($nombreTratamiento === 'encerado') ? 8.0 : 10.0;

            ProyectoDetalle::create([
                'proyectoID' => $proyecto->proyectoID,
                'pieza' => $pieza,
                'tratamientoID' => $tratamientoID,
                'precio' => $precio,
                'color' => $d['color'] ?? null,
            ]);
        }
    }

    /**
     * Calcular total desde detalles
     */
    public function calculateTotalFromDetalles(Proyecto $proyecto): float
    {
        return $proyecto->detalles()->sum('precio') ?? 0.0;
    }

    /**
     * Reemplazar todos los detalles del proyecto
     */
    public function reemplazarDetalles(Proyecto $proyecto, array $detalles): void
    {
        $proyecto->detalles()->delete();
        $this->crearDetalles($proyecto, $detalles);
    }
}

