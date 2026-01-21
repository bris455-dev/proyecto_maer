<?php

namespace App\Services\Proyectos;

use App\Models\Proyecto;
use App\Helpers\RoleHelper;

class ProyectoTipificacionService
{
    /**
     * Calcular tipificación del proyecto
     */
    public function calcularTipificacion(Proyecto $proyecto): string
    {
        // Si ya está "Aprobado", no cambiar
        if ($proyecto->tipificacion === 'Aprobado') {
            return 'Aprobado';
        }
        
        // Si hay fecha_fin y ya pasó, y no está "Aprobado", es "Atrasado"
        if ($proyecto->fecha_fin) {
            $fechaFin = is_string($proyecto->fecha_fin) ? strtotime($proyecto->fecha_fin) : $proyecto->fecha_fin->timestamp;
            $hoy = time();
            
            if ($fechaFin < $hoy && $proyecto->tipificacion !== 'Aprobado') {
                return 'Atrasado';
            }
        }
        
        // Mantener la tipificación actual si no aplica "Atrasado"
        return $proyecto->tipificacion ?? 'Pendiente';
    }

    /**
     * Validar si un usuario puede cambiar la tipificación
     */
    public function validarCambioTipificacion($actor, string $nuevaTipificacion): array
    {
        // Si el usuario tiene clienteID (es cliente), solo puede establecer a "Aprobado"
        if ($actor->clienteID && $nuevaTipificacion !== 'Aprobado') {
            return [
                'success' => false,
                'message' => 'Los clientes solo pueden establecer el estado a "Aprobado".'
            ];
        }
        
        return ['success' => true];
    }
}

