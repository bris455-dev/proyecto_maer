<?php

namespace App\Services;

use App\Models\Proyecto;
use App\Helpers\RoleHelper;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ReportExport;

class ReporteService
{
    /**
     * Genera los reportes filtrados
     */
    public function generate(array $filters, $user)
    {
        $query = Proyecto::with(['detalles.tratamiento', 'cliente', 'empleado']);

        // Filtrar según rol: administrador ve todo, otros solo sus proyectos
        if (!RoleHelper::isAdmin($user)) {
            if ($user->empleadoID) {
                // Usuario con empleadoID: solo sus proyectos
                $query->where('empleadoID', $user->empleadoID);
            } elseif ($user->clienteID) {
                // Usuario con clienteID: solo sus proyectos
                $query->where('clienteID', $user->clienteID);
            } else {
                // Usuario sin empleadoID ni clienteID: sin proyectos
                return ['dashboard' => [
                    'total_proyectos' => 0,
                    'total_unidades' => 0,
                    'total_clientes' => 0,
                    'total_disenadores' => 0,
                    'total_facturacion' => 0,
                    'total_comisiones' => 0,
                ], 'report' => []];
            }
        }

        // Filtros adicionales
        if (!empty($filters['fecha_inicio'])) {
            $query->whereDate('fecha_inicio', '>=', $filters['fecha_inicio']);
        }
        if (!empty($filters['fecha_fin'])) {
            $query->whereDate('fecha_inicio', '<=', $filters['fecha_fin']);
        }

        if (!empty($filters['clienteID'])) {
            $query->where('clienteID', $filters['clienteID']);
        }
        if (!empty($filters['empleadoID'])) {
            $query->where('empleadoID', $filters['empleadoID']);
        }
        if (!empty($filters['tipo_pieza'])) {
            $query->whereHas('detalles', function($q) use ($filters){
                $q->where('pieza', $filters['tipo_pieza']);
            });
        }

        $proyectos = $query->orderBy('fecha_inicio', 'desc')->get();

        // Calcular totales de facturación
        $totalFacturacion = 0;
        $totalComisiones = 0;
        
        foreach ($proyectos as $proyecto) {
            $precioTotal = $proyecto->detalles->sum(function($d) {
                return is_numeric($d->precio) ? (float)$d->precio : 0;
            });
            $totalFacturacion += $precioTotal;
            $totalComisiones += round($precioTotal * 0.35, 2); // Comisión 35%
        }

        // Dashboard indicadores
        $dashboard = [
            'total_proyectos' => $proyectos->count(),
            'total_unidades' => $proyectos->sum(fn($p) => $p->detalles->count()),
            'total_clientes' => $proyectos->pluck('clienteID')->filter()->unique()->count(),
            'total_disenadores' => $proyectos->pluck('empleadoID')->filter()->unique()->count(),
            'total_facturacion' => round($totalFacturacion, 2),
            'total_comisiones' => round($totalComisiones, 2),
        ];

        // Armar tabla de reportes
        $report = $proyectos->map(function($p) use ($user) {
            try {
                $detalleProyecto = $p->detalles->map(function($d) {
                    $pieza = $d->pieza ?? '';
                    $tratamiento = $d->tratamiento->nombre ?? 'otro';
                    return $pieza . '+' . $tratamiento;
                })->implode(', ');
                
                $unidades = $p->detalles->count();
                $precioTotal = $p->detalles->sum(function($d) {
                    return is_numeric($d->precio) ? (float)$d->precio : 0;
                });
                $comision = round($precioTotal * 0.35, 2); // Comisión del diseñador 35%

                // Formatear fechas a string de forma segura
                $fechaInicio = '';
                if ($p->fecha_inicio) {
                    if (is_string($p->fecha_inicio)) {
                        $fechaInicio = $p->fecha_inicio;
                    } elseif (is_object($p->fecha_inicio) && method_exists($p->fecha_inicio, 'format')) {
                        $fechaInicio = $p->fecha_inicio->format('Y-m-d');
                    } else {
                        $fechaInicio = (string)$p->fecha_inicio;
                    }
                }
                
                $fechaLimite = '';
                if ($p->fecha_entrega) {
                    if (is_string($p->fecha_entrega)) {
                        $fechaLimite = $p->fecha_entrega;
                    } elseif (is_object($p->fecha_entrega) && method_exists($p->fecha_entrega, 'format')) {
                        $fechaLimite = $p->fecha_entrega->format('Y-m-d');
                    } else {
                        $fechaLimite = (string)$p->fecha_entrega;
                    }
                }

                $row = [
                    'idReporte' => (int)($p->proyectoID ?? 0),
                    'Cliente' => (string)($p->cliente->nombre ?? ''),
                    'Documento_Cliente' => (string)($p->cliente->dni_ruc ?? ''),
                    'FechaInicio' => $fechaInicio,
                    'FechaLimite' => $fechaLimite,
                    'Paciente' => (string)($p->nombre ?? ''),
                    'Detalle_Proyecto' => (string)$detalleProyecto,
                    'Unidades' => (int)$unidades,
                    'NombreDiseñador' => (string)($p->empleado->nombre ?? ''),
                    'Notas' => (string)($p->notas ?? '')
                ];

                // Solo administradores ven precioTotal y comisión
                if (RoleHelper::isAdmin($user)) {
                    $row['PrecioTotal'] = (float)$precioTotal;
                    $row['ComisionDiseñador'] = (float)$comision;
                }

                return $row;
            } catch (\Throwable $e) {
                \Log::warning("Error procesando proyecto ID {$p->proyectoID}: " . $e->getMessage());
                return null;
            }
        })->filter(); // Eliminar elementos null

        return ['dashboard' => $dashboard, 'report' => $report];
    }

    /**
     * Exportar a Excel
     */
    public function exportExcel($report, string $filename = 'reporte.xlsx')
    {
        try {
            // Convertir Collection a array si es necesario
            $reportArray = is_array($report) ? $report : $report->toArray();
            
            // Asegurar que sea un array indexado numéricamente
            $reportArray = array_values($reportArray);
            
            if (empty($reportArray)) {
                throw new \Exception('No hay datos para exportar');
            }
            
            return Excel::download(new ReportExport($reportArray), $filename);
        } catch (\Throwable $e) {
            \Log::error("Error en exportExcel: " . $e->getMessage() . " - " . $e->getTraceAsString());
            throw $e;
        }
    }
}
