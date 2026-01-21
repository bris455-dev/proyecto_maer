<?php

namespace App\Services\Inventario;

use App\Models\Inventario\ProductoInventario;
use App\Models\Inventario\CategoriaInventario;
use App\Models\Inventario\MovimientoInventario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InventarioService
{
    /**
     * Listar productos con filtros
     */
    public function listarProductos(array $filters = [])
    {
        $query = ProductoInventario::with(['categoria', 'creador']);

        // Filtros
        if (!empty($filters['busqueda'])) {
            $query->where(function($q) use ($filters) {
                $q->where('codigo', 'like', "%{$filters['busqueda']}%")
                  ->orWhere('nombre', 'like', "%{$filters['busqueda']}%");
            });
        }

        if (!empty($filters['categoria_id'])) {
            $query->where('categoria_id', $filters['categoria_id']);
        }

        if (isset($filters['activo'])) {
            $query->where('activo', $filters['activo']);
        }

        if (isset($filters['stock_bajo'])) {
            $query->whereRaw('stock_actual <= stock_minimo');
        }

        // Ordenamiento
        $sortBy = $filters['sort_by'] ?? 'nombre';
        $sortOrder = $filters['sort_order'] ?? 'asc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Crear producto
     */
    public function crearProducto(array $data, $usuario)
    {
        DB::beginTransaction();
        try {
            $producto = ProductoInventario::create([
                'codigo' => $data['codigo'],
                'nombre' => $data['nombre'],
                'descripcion' => $data['descripcion'] ?? null,
                'categoria_id' => $data['categoria_id'],
                'unidad_medida' => $data['unidad_medida'] ?? 'unidad',
                'stock_actual' => $data['stock_inicial'] ?? 0,
                'stock_minimo' => $data['stock_minimo'] ?? 0,
                'stock_maximo' => $data['stock_maximo'] ?? null,
                'precio_unitario' => $data['precio_unitario'] ?? 0,
                'proveedor' => $data['proveedor'] ?? null,
                'ubicacion' => $data['ubicacion'] ?? null,
                'activo' => $data['activo'] ?? true,
                'created_by' => $usuario->id
            ]);

            // Si hay stock inicial, crear movimiento de entrada
            if (($data['stock_inicial'] ?? 0) > 0) {
                MovimientoInventario::create([
                    'producto_id' => $producto->id,
                    'tipo' => 'entrada',
                    'cantidad' => $data['stock_inicial'],
                    'stock_anterior' => 0,
                    'stock_nuevo' => $data['stock_inicial'],
                    'motivo' => 'Stock inicial',
                    'usuario_id' => $usuario->id
                ]);
            }

            DB::commit();
            return [
                'success' => true,
                'data' => $producto->load(['categoria', 'creador'])
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error InventarioService@crearProducto: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al crear producto: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Actualizar producto
     */
    public function actualizarProducto($id, array $data)
    {
        DB::beginTransaction();
        try {
            $producto = ProductoInventario::findOrFail($id);
            $producto->update($data);

            DB::commit();
            return [
                'success' => true,
                'data' => $producto->load(['categoria', 'creador'])
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error InventarioService@actualizarProducto: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al actualizar producto: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Registrar movimiento de inventario
     */
    public function registrarMovimiento($productoId, $tipo, $cantidad, $motivo, $usuario, $referencia = null, $produccionId = null)
    {
        DB::beginTransaction();
        try {
            $producto = ProductoInventario::findOrFail($productoId);
            $stockAnterior = $producto->stock_actual;

            // Calcular nuevo stock
            if ($tipo === 'entrada') {
                $stockNuevo = $stockAnterior + $cantidad;
            } elseif ($tipo === 'salida') {
                if ($stockAnterior < $cantidad) {
                    throw new \Exception("Stock insuficiente. Stock actual: {$stockAnterior}, solicitado: {$cantidad}");
                }
                $stockNuevo = $stockAnterior - $cantidad;
            } else { // ajuste
                $stockNuevo = $cantidad;
            }

            // Actualizar stock del producto
            $producto->stock_actual = $stockNuevo;
            $producto->save();

            // Crear movimiento
            $movimiento = MovimientoInventario::create([
                'producto_id' => $productoId,
                'tipo' => $tipo,
                'cantidad' => $cantidad,
                'stock_anterior' => $stockAnterior,
                'stock_nuevo' => $stockNuevo,
                'motivo' => $motivo,
                'referencia' => $referencia,
                'usuario_id' => $usuario->id,
                'produccion_id' => $produccionId
            ]);

            DB::commit();
            return [
                'success' => true,
                'data' => $movimiento->load(['producto', 'usuario'])
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error InventarioService@registrarMovimiento: " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Obtener movimientos de un producto
     */
    public function obtenerMovimientos($productoId, array $filters = [])
    {
        $query = MovimientoInventario::with(['producto', 'usuario'])
            ->where('producto_id', $productoId);

        if (!empty($filters['tipo'])) {
            $query->where('tipo', $filters['tipo']);
        }

        if (!empty($filters['fecha_inicio'])) {
            $query->whereDate('created_at', '>=', $filters['fecha_inicio']);
        }

        if (!empty($filters['fecha_fin'])) {
            $query->whereDate('created_at', '<=', $filters['fecha_fin']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Obtener categorías
     */
    public function obtenerCategorias($activas = true)
    {
        $query = CategoriaInventario::query();
        if ($activas) {
            $query->where('activo', true);
        }
        return $query->orderBy('nombre')->get();
    }
}

