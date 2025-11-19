<?php

namespace App\Services;

use App\Models\Proyecto;
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

        // Filtrar según rol
        if ($user->rolID == 2) {
            $query->where('empleadoID', $user->empleadoID);
        } elseif ($user->rolID == 3) {
            $query->where('clienteID', $user->clienteID);
        }
        // rol 1 = admin, no filtrar por empleado ni cliente

        // Filtros adicionales
        if (!empty($filters['fecha_inicio'])) {
         $query->whereDate('fecha_inicio', $filters['fecha_inicio']);
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

        // Dashboard indicadores
        $dashboard = [
            'total_proyectos' => $proyectos->count(),
            'total_unidades' => $proyectos->sum(fn($p) => $p->detalles->count()),
            'total_clientes' => $proyectos->pluck('clienteID')->filter()->unique()->count(),
            'total_disenadores' => $proyectos->pluck('empleadoID')->filter()->unique()->count(),
        ];

        // Armar tabla de reportes
        $report = $proyectos->map(function($p) use ($user) {
            $detalleProyecto = $p->detalles->map(fn($d) => $d->pieza . '+' . ($d->tratamiento->nombre ?? 'otro'))->implode(', ');
            $unidades = $p->detalles->count();
            $precioTotal = $p->detalles->sum(fn($d) => $d->precio);
            $comision = $precioTotal * 0.35; // Comisión del diseñador 35%

            $row = [
                'idReporte' => $p->proyectoID,
                'Cliente' => $p->cliente->nombre ?? '',
                'Documento_Cliente' => $p->cliente->dni_ruc ?? '',
                'FechaInicio' => $p->fecha_inicio,
                'FechaLimite' => $p->fecha_entrega,
                'Paciente' => $p->nombre,
                'Detalle_Proyecto' => $detalleProyecto,
                'Unidades' => $unidades,
                'NombreDiseñador' => $p->empleado->nombre ?? '',
                'Notas' => $p->notas ?? ''
            ];

            // Solo admins ven precioTotal y comisión
            if ($user->rolID == 1) {
                $row['PrecioTotal'] = $precioTotal;
                $row['ComisionDiseñador'] = $comision;
            }

            return $row;
        });

        return ['dashboard' => $dashboard, 'report' => $report];
    }

    /**
     * Exportar a Excel
     */
    public function exportExcel(array $report, string $filename = 'reporte.xlsx')
    {
        return Excel::download(new ReportExport($report), $filename);
    }
}
