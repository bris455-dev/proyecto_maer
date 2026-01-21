<?php

namespace App\Services\Produccion;

use App\Models\Produccion\ProduccionEntrega;
use App\Models\Produccion\ProduccionEntregaDetalle;
use App\Services\Inventario\InventarioService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ProduccionService
{
    protected InventarioService $inventarioService;

    public function __construct(InventarioService $inventarioService)
    {
        $this->inventarioService = $inventarioService;
    }

    /**
     * Listar entregas con filtros
     */
    public function listarEntregas(array $filters = [])
    {
        $query = ProduccionEntrega::with(['usuarioAsignado', 'usuarioEntrega', 'creador', 'detalles.producto']);

        // Filtros
        if (!empty($filters['usuario_asignado_id'])) {
            $query->where('usuario_asignado_id', $filters['usuario_asignado_id']);
        }

        if (!empty($filters['estado'])) {
            $query->where('estado', $filters['estado']);
        }

        if (!empty($filters['fecha_inicio'])) {
            $query->whereDate('fecha_entrega', '>=', $filters['fecha_inicio']);
        }

        if (!empty($filters['fecha_fin'])) {
            $query->whereDate('fecha_entrega', '<=', $filters['fecha_fin']);
        }

        if (!empty($filters['busqueda'])) {
            $query->where(function($q) use ($filters) {
                $q->where('numero_entrega', 'like', "%{$filters['busqueda']}%")
                  ->orWhere('motivo', 'like', "%{$filters['busqueda']}%");
            });
        }

        // Ordenamiento
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Crear entrega
     */
    public function crearEntrega(array $data, $usuario)
    {
        DB::beginTransaction();
        try {
            // Generar número de entrega
            $numeroEntrega = $this->generarNumeroEntrega();

            $entrega = ProduccionEntrega::create([
                'numero_entrega' => $numeroEntrega,
                'usuario_asignado_id' => $data['usuario_asignado_id'],
                'fecha_entrega' => $data['fecha_entrega'],
                'motivo' => $data['motivo'] ?? null,
                'estado' => 'pendiente',
                'observaciones' => $data['observaciones'] ?? null,
                'created_by' => $usuario->id
            ]);

            // Crear detalles
            foreach ($data['productos'] as $producto) {
                ProduccionEntregaDetalle::create([
                    'entrega_id' => $entrega->id,
                    'producto_id' => $producto['producto_id'],
                    'cantidad' => $producto['cantidad'],
                    'precio_unitario' => $producto['precio_unitario'] ?? 0,
                    'observaciones' => $producto['observaciones'] ?? null
                ]);
            }

            DB::commit();
            return [
                'success' => true,
                'data' => $entrega->load(['usuarioAsignado', 'creador', 'detalles.producto'])
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error ProduccionService@crearEntrega: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al crear entrega: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Procesar entrega (descontar del inventario)
     */
    public function procesarEntrega($id, $usuario)
    {
        DB::beginTransaction();
        try {
            $entrega = ProduccionEntrega::with('detalles.producto')->findOrFail($id);

            if ($entrega->estado !== 'pendiente') {
                throw new \Exception("La entrega ya fue procesada o cancelada");
            }

            // Descontar productos del inventario
            foreach ($entrega->detalles as $detalle) {
                $resultado = $this->inventarioService->registrarMovimiento(
                    $detalle->producto_id,
                    'salida',
                    $detalle->cantidad,
                    "Entrega #{$entrega->numero_entrega}: {$entrega->motivo}",
                    $usuario,
                    $entrega->numero_entrega,
                    $entrega->id
                );

                if (!$resultado['success']) {
                    throw new \Exception($resultado['message']);
                }
            }

            // Actualizar estado de la entrega
            $entrega->estado = 'entregado';
            $entrega->usuario_entrega_id = $usuario->id;
            $entrega->save();

            DB::commit();
            return [
                'success' => true,
                'data' => $entrega->load(['usuarioAsignado', 'usuarioEntrega', 'creador', 'detalles.producto'])
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error ProduccionService@procesarEntrega: " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Cancelar entrega
     */
    public function cancelarEntrega($id)
    {
        DB::beginTransaction();
        try {
            $entrega = ProduccionEntrega::findOrFail($id);

            if ($entrega->estado === 'entregado') {
                throw new \Exception("No se puede cancelar una entrega ya procesada");
            }

            $entrega->estado = 'cancelado';
            $entrega->save();

            DB::commit();
            return [
                'success' => true,
                'data' => $entrega
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error ProduccionService@cancelarEntrega: " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Obtener entrega por ID
     */
    public function obtenerEntrega($id)
    {
        return ProduccionEntrega::with([
            'usuarioAsignado',
            'usuarioEntrega',
            'creador',
            'detalles.producto.categoria'
        ])->findOrFail($id);
    }

    /**
     * Generar número de entrega único
     */
    private function generarNumeroEntrega()
    {
        $fecha = Carbon::now()->format('Ymd');
        $ultimoNumero = ProduccionEntrega::whereDate('created_at', Carbon::today())
            ->max(DB::raw('CAST(SUBSTRING(numero_entrega, -4) AS UNSIGNED)')) ?? 0;
        
        $nuevoNumero = str_pad($ultimoNumero + 1, 4, '0', STR_PAD_LEFT);
        return "ENT-{$fecha}-{$nuevoNumero}";
    }
}

