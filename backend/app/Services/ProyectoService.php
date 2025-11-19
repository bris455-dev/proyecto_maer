<?php

namespace App\Services;

use App\Models\Proyecto;
use App\Models\Tratamiento;
use App\Models\ProyectoDetalle;
use Illuminate\Support\Facades\Log;
use App\Services\BitacoraService;
use Illuminate\Support\Facades\DB;

class ProyectoService
{
    protected BitacoraService $bitacoraService;

    public function __construct(BitacoraService $bitacoraService)
    {
        $this->bitacoraService = $bitacoraService;
    }

    /**
     * Crear proyecto con detalles
     */
    public function create(array $data, $actor, string $ip): array
    {
        DB::beginTransaction();
        try {
            $detalles = $data['detalles'] ?? [];

            $proyecto = Proyecto::create([
                'numero_proyecto' => $data['numero_proyecto'] ?? null,
                'nombre' => $data['nombre'],
                'clienteID' => $data['clienteID'] ?? null,
                'empleadoID' => $data['empleadoID'] ?? null,
                'fecha_inicio' => $data['fecha_inicio'] ?? null,
                'fecha_fin' => $data['fecha_fin'] ?? null,
                'fecha_entrega' => $data['fecha_entrega'] ?? null,
                'notas' => $data['notas'] ?? null,
                'estado' => $data['estado'] ?? 1,
                'total' => 0,
                'created_by' => $actor->id ?? null,
            ]);

            // Insertar detalles y calcular precio
            foreach ($detalles as $d) {
                $pieza = $d['pieza'] ?? null;
                $tratamientoID = $d['tratamientoID'] ?? null;
                $tModel = $tratamientoID ? Tratamiento::find($tratamientoID) : null;
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

            // Calcular total
            $proyecto->total = $this->calculateTotalFromDetalles($proyecto);
            $proyecto->save();

            // Bitácora
            $this->bitacoraService->registrar(
                $actor,
                'Creación de proyecto',
                "Proyecto ID {$proyecto->proyectoID} creado para {$proyecto->nombre}.",
                $ip
            );

            DB::commit();
            return ['success' => true, 'data' => $proyecto];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("❌ Error ProyectoService@create: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al crear proyecto.'];
        }
    }

    /**
     * Actualizar proyecto con detalles
     */
    public function update(Proyecto $proyecto, array $data, $actor, string $ip): array
    {
        DB::beginTransaction();
        try {
            foreach (['numero_proyecto','nombre','clienteID','empleadoID','fecha_inicio','fecha_fin','fecha_entrega','notas','estado'] as $f) {
                if (array_key_exists($f, $data)) $proyecto->{$f} = $data[$f];
            }

            // Reemplazar detalles
            if (!empty($data['detalles'])) {
                $proyecto->detalles()->delete();
                foreach ($data['detalles'] as $d) {
                    $pieza = $d['pieza'] ?? null;
                    $tratamientoID = $d['tratamientoID'] ?? null;
                    $tModel = $tratamientoID ? Tratamiento::find($tratamientoID) : null;
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

            // Recalcular total
            $proyecto->total = $this->calculateTotalFromDetalles($proyecto);
            $proyecto->save();

            $this->bitacoraService->registrar(
                $actor,
                'Actualización de proyecto',
                "Proyecto ID {$proyecto->proyectoID} actualizado.",
                $ip
            );

            DB::commit();
            return ['success' => true, 'data' => $proyecto];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("❌ Error ProyectoService@update: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al actualizar proyecto.'];
        }
    }

    /**
     * Calcular total sumando precios de detalles
     */
    protected function calculateTotalFromDetalles(Proyecto $proyecto): float
    {
        $proyecto->loadMissing('detalles');
        return round($proyecto->detalles->sum(fn($d) => $d->precio), 2);
    }

    /**
     * Resumen de facturación incluyendo comisión diseñador (35%)
     */
    public function billingSummary(Proyecto $proyecto, $user)
    {
        $proyecto->loadMissing('detalles.tratamiento', 'empleado');

        $resumen = [];
        $totalGeneral = 0;
        $comisionTotal = 0;

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
                'comision_disenador' => ($user->rolID === 1) ? $comision : null
            ];
        }

        return [
            'success' => true,
            'resumen' => $resumen,
            'total_general' => ($user->rolID === 1) ? $totalGeneral : null,
            'comision_total' => ($user->rolID === 1) ? $comisionTotal : null
        ];
    }

    /**
     * Lista proyectos según rol
     */
    public function listForUser($user, array $filters = [])
    {
        $query = Proyecto::query();

        if ($user->rolID == 1) {
            // Admin: todos los proyectos
        } elseif ($user->rolID == 2) {
            $query->where('empleadoID', $user->empleadoID);
        } else {
            $query->where('clienteID', $user->clienteID);
        }

        if (!empty($filters['q'])) {
            $q = $filters['q'];
            $query->where(fn($qf) => $qf->where('nombre','like',"%{$q}%")->orWhere('proyectoID',$q));
        }

        return $query->orderBy('created_at','desc')->get();
    }

    /**
     * Normaliza paths de imágenes
     */
    protected function processUploadedImagePaths($images): array
    {
        if (!is_array($images)) return [];
        return array_filter($images, fn($i) => is_string($i));
    }
}
