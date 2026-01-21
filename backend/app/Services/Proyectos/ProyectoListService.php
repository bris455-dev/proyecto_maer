<?php

namespace App\Services\Proyectos;

use App\Models\Proyecto;
use App\Services\Proyectos\ProyectoTipificacionService;
use App\Helpers\RoleHelper;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;

class ProyectoListService
{
    protected ProyectoTipificacionService $tipificacionService;

    public function __construct(ProyectoTipificacionService $tipificacionService)
    {
        $this->tipificacionService = $tipificacionService;
    }

    /**
     * Lista proyectos según rol
     */
    public function listForUser($user, array $filters = []): Collection
    {
        try {
            $query = Proyecto::query();

            // Administrador: todos los proyectos
            if (RoleHelper::isAdmin($user)) {
                // Sin filtros adicionales
            } elseif ($user->empleadoID) {
                // Usuario con empleadoID (diseñador): solo sus proyectos
                $query->where('empleadoID', $user->empleadoID);
            } elseif ($user->clienteID) {
                // Usuario con clienteID (cliente): solo sus proyectos
                $query->where('clienteID', $user->clienteID);
            } else {
                // Usuario sin empleadoID ni clienteID: no tiene proyectos
                return collect([]);
            }

            if (!empty($filters['q'])) {
                $q = $filters['q'];
                $query->where(fn($qf) => $qf->where('nombre','like',"%{$q}%")->orWhere('proyectoID',$q));
            }

            $proyectos = $query->orderBy('proyectoID', 'desc')->get();
            
            // Calcular tipificación "Atrasado" automáticamente para cada proyecto
            foreach ($proyectos as $proyecto) {
                $proyecto->tipificacion = $this->tipificacionService->calcularTipificacion($proyecto);
            }
            
            return $proyectos;
        } catch (\Throwable $e) {
            Log::error("Error ProyectoListService@listForUser: " . $e->getMessage());
            return collect([]);
        }
    }
}

