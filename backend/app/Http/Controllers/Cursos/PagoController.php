<?php

namespace App\Http\Controllers\Cursos;

use App\Http\Controllers\Controller;
use App\Services\PagoService;
use App\Services\MatriculaService;
use App\Services\CarritoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PagoController extends Controller
{
    protected PagoService $pagoService;
    protected MatriculaService $matriculaService;
    protected CarritoService $carritoService;

    public function __construct(
        PagoService $pagoService,
        MatriculaService $matriculaService,
        CarritoService $carritoService
    ) {
        $this->pagoService = $pagoService;
        $this->matriculaService = $matriculaService;
        $this->carritoService = $carritoService;
    }

    /**
     * Procesar pago desde carrito
     */
    public function procesarPago(Request $request)
    {
        try {
            $validated = $request->validate([
                'metodo_pago' => 'required|in:Tarjeta,PayPal,Yape,Plin',
                'datos_transaccion' => 'nullable|array',
                'notas' => 'nullable|string',
            ]);

            $user = $request->user();

            // Obtener carrito
            $carritoResult = $this->carritoService->getByUsuario($user->id);
            if (!$carritoResult['success'] || $carritoResult['data']->isEmpty()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'El carrito está vacío'
                ], 400);
            }

            // Crear matrículas para cada curso del carrito
            $matriculaIDs = [];
            foreach ($carritoResult['data'] as $item) {
                $matriculaResult = $this->matriculaService->create($item->cursoID, $user->id);
                if ($matriculaResult['success']) {
                    $matriculaIDs[] = $matriculaResult['data']->matriculaID;
                }
            }

            if (empty($matriculaIDs)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Error al crear matrículas'
                ], 400);
            }

            // Procesar pago
            $validated['monto'] = $carritoResult['total'];
            $validated['matriculaIDs'] = $matriculaIDs;

            $result = $this->pagoService->procesarPago($user->id, $validated);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Pago procesado correctamente',
                'data' => $result['data']
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error PagoController@procesarPago: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al procesar pago'
            ], 500);
        }
    }

    /**
     * Obtener pagos del usuario
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $result = $this->pagoService->getByUsuario($user->id);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'data' => $result['data']
            ]);
        } catch (\Throwable $e) {
            Log::error("Error PagoController@index: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener pagos'
            ], 500);
        }
    }
}

