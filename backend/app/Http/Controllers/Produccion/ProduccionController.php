<?php

namespace App\Http\Controllers\Produccion;

use App\Http\Controllers\Controller;
use App\Services\Produccion\ProduccionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProduccionController extends Controller
{
    protected ProduccionService $service;

    public function __construct(ProduccionService $service)
    {
        $this->service = $service;
    }

    /**
     * Listar entregas
     */
    public function index(Request $request)
    {
        try {
            $filters = $request->only([
                'usuario_asignado_id',
                'estado',
                'fecha_inicio',
                'fecha_fin',
                'busqueda',
                'sort_by',
                'sort_order',
                'per_page'
            ]);

            $entregas = $this->service->listarEntregas($filters);

            return response()->json([
                'status' => 'success',
                'data' => $entregas
            ]);
        } catch (\Throwable $e) {
            Log::error("Error ProduccionController@index: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener entregas'
            ], 500);
        }
    }

    /**
     * Crear entrega
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'usuario_asignado_id' => 'required|exists:usuarios,id',
                'fecha_entrega' => 'required|date',
                'motivo' => 'nullable|string|max:500',
                'observaciones' => 'nullable|string',
                'productos' => 'required|array|min:1',
                'productos.*.producto_id' => 'required|exists:productos_inventario,id',
                'productos.*.cantidad' => 'required|numeric|min:0.01',
                'productos.*.precio_unitario' => 'nullable|numeric|min:0',
                'productos.*.observaciones' => 'nullable|string'
            ]);

            $result = $this->service->crearEntrega($validated, $request->user());

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Entrega creada correctamente',
                'data' => $result['data']
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error ProduccionController@store: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al crear entrega'
            ], 500);
        }
    }

    /**
     * Obtener entrega por ID
     */
    public function show($id)
    {
        try {
            $entrega = $this->service->obtenerEntrega($id);

            return response()->json([
                'status' => 'success',
                'data' => $entrega
            ]);
        } catch (\Throwable $e) {
            Log::error("Error ProduccionController@show: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Entrega no encontrada'
            ], 404);
        }
    }

    /**
     * Procesar entrega (descontar del inventario)
     */
    public function procesar(Request $request, $id)
    {
        try {
            $result = $this->service->procesarEntrega($id, $request->user());

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Entrega procesada correctamente',
                'data' => $result['data']
            ]);
        } catch (\Throwable $e) {
            Log::error("Error ProduccionController@procesar: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al procesar entrega'
            ], 500);
        }
    }

    /**
     * Cancelar entrega
     */
    public function cancelar(Request $request, $id)
    {
        try {
            $result = $this->service->cancelarEntrega($id);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Entrega cancelada correctamente',
                'data' => $result['data']
            ]);
        } catch (\Throwable $e) {
            Log::error("Error ProduccionController@cancelar: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al cancelar entrega'
            ], 500);
        }
    }
}

