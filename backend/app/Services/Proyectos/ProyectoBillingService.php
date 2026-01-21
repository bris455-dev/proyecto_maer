<?php

namespace App\Services\Proyectos;

use App\Models\Proyecto;
use App\Helpers\RoleHelper;

class ProyectoBillingService
{
    /**
     * Resumen de facturación incluyendo comisión diseñador (35%)
     */
    public function billingSummary(Proyecto $proyecto, $user): array
    {
        $proyecto->loadMissing('detalles.tratamiento', 'empleado');

        $resumen = [];
        $totalGeneral = 0;
        $comisionTotal = 0;
        
        // Verificar si el usuario es administrador usando RoleHelper
        $isAdmin = RoleHelper::isAdmin($user);

        foreach ($proyecto->detalles as $detalle) {
            $tName = $detalle->tratamiento ? $detalle->tratamiento->nombre : 'Otro';
            $subtotal = $detalle->precio;
            $comision = $detalle->precio * 0.35; // 35% comisión diseñador
            $totalGeneral += $subtotal;
            $comisionTotal += $comision;

            $resumen[] = [
                'pieza' => $detalle->pieza,
                'tratamiento' => $tName,
                'precio_unitario' => $detalle->precio,
                'comision_disenador' => $isAdmin ? $comision : null
            ];
        }

        return [
            'success' => true,
            'resumen' => $resumen,
            'total_general' => $isAdmin ? $totalGeneral : null,
            'comision_total' => $isAdmin ? $comisionTotal : null
        ];
    }
}

