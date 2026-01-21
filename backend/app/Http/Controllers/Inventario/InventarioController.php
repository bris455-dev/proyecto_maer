<?php

namespace App\Http\Controllers\Inventario;

use App\Http\Controllers\Controller;
use App\Services\Inventario\InventarioService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InventarioController extends Controller
{
    protected InventarioService $service;

    public function __construct(InventarioService $service)
    {
        $this->service = $service;
    }

    /**
     * Listar productos
     */
    public function index(Request $request)
    {
        try {
            $filters = $request->only([
                'busqueda',
                'categoria_id',
                'activo',
                'stock_bajo',
                'sort_by',
                'sort_order',
                'per_page'
            ]);

            $productos = $this->service->listarProductos($filters);

            return response()->json([
                'status' => 'success',
                'data' => $productos
            ]);
        } catch (\Throwable $e) {
            Log::error("Error InventarioController@index: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener productos'
            ], 500);
        }
    }

    /**
     * Crear producto
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'codigo' => 'required|string|max:50|unique:productos_inventario,codigo',
                'nombre' => 'required|string|max:200',
                'descripcion' => 'nullable|string',
                'categoria_id' => 'required|exists:categorias_inventario,id',
                'unidad_medida' => 'nullable|string|max:20',
                'stock_inicial' => 'nullable|numeric|min:0',
                'stock_minimo' => 'nullable|numeric|min:0',
                'stock_maximo' => 'nullable|numeric|min:0',
                'precio_unitario' => 'nullable|numeric|min:0',
                'proveedor' => 'nullable|string|max:200',
                'ubicacion' => 'nullable|string|max:100',
                'activo' => 'nullable|boolean'
            ]);

            $result = $this->service->crearProducto($validated, $request->user());

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Producto creado correctamente',
                'data' => $result['data']
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error InventarioController@store: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al crear producto'
            ], 500);
        }
    }

    /**
     * Actualizar producto
     */
    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'codigo' => 'sometimes|string|max:50|unique:productos_inventario,codigo,' . $id,
                'nombre' => 'sometimes|string|max:200',
                'descripcion' => 'nullable|string',
                'categoria_id' => 'sometimes|exists:categorias_inventario,id',
                'unidad_medida' => 'nullable|string|max:20',
                'stock_minimo' => 'nullable|numeric|min:0',
                'stock_maximo' => 'nullable|numeric|min:0',
                'precio_unitario' => 'nullable|numeric|min:0',
                'proveedor' => 'nullable|string|max:200',
                'ubicacion' => 'nullable|string|max:100',
                'activo' => 'nullable|boolean'
            ]);

            $result = $this->service->actualizarProducto($id, $validated);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Producto actualizado correctamente',
                'data' => $result['data']
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error InventarioController@update: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar producto'
            ], 500);
        }
    }

    /**
     * Obtener producto por ID
     */
    public function show($id)
    {
        try {
            $producto = \App\Models\Inventario\ProductoInventario::with(['categoria', 'creador'])
                ->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'data' => $producto
            ]);
        } catch (\Throwable $e) {
            Log::error("Error InventarioController@show: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Producto no encontrado'
            ], 404);
        }
    }

    /**
     * Obtener categorías
     */
    public function categorias(Request $request)
    {
        try {
            $activas = $request->boolean('activas', true);
            $categorias = $this->service->obtenerCategorias($activas);

            return response()->json([
                'status' => 'success',
                'data' => $categorias
            ]);
        } catch (\Throwable $e) {
            Log::error("Error InventarioController@categorias: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener categorías'
            ], 500);
        }
    }

    /**
     * Registrar movimiento de inventario
     */
    public function movimiento(Request $request)
    {
        try {
            $validated = $request->validate([
                'producto_id' => 'required|exists:productos_inventario,id',
                'tipo' => 'required|in:entrada,salida,ajuste',
                'cantidad' => 'required|numeric|min:0.01',
                'motivo' => 'required|string|max:500',
                'referencia' => 'nullable|string|max:100'
            ]);

            $result = $this->service->registrarMovimiento(
                $validated['producto_id'],
                $validated['tipo'],
                $validated['cantidad'],
                $validated['motivo'],
                $request->user(),
                $validated['referencia'] ?? null
            );

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Movimiento registrado correctamente',
                'data' => $result['data']
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error InventarioController@movimiento: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al registrar movimiento'
            ], 500);
        }
    }

    /**
     * Obtener movimientos de un producto
     */
    public function movimientos(Request $request, $id)
    {
        try {
            $filters = $request->only(['tipo', 'fecha_inicio', 'fecha_fin', 'per_page']);
            $movimientos = $this->service->obtenerMovimientos($id, $filters);

            return response()->json([
                'status' => 'success',
                'data' => $movimientos
            ]);
        } catch (\Throwable $e) {
            Log::error("Error InventarioController@movimientos: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener movimientos'
            ], 500);
        }
    }
}

