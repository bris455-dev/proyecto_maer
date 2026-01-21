<?php

namespace App\Http\Controllers\Cursos;

use App\Http\Controllers\Controller;
use App\Services\CarritoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CarritoController extends Controller
{
    protected CarritoService $carritoService;

    public function __construct(CarritoService $carritoService)
    {
        $this->carritoService = $carritoService;
    }

    /**
     * Obtener carrito del usuario
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $result = $this->carritoService->getByUsuario($user->id);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'data' => $result['data'],
                'total' => $result['total']
            ]);
        } catch (\Throwable $e) {
            Log::error("Error CarritoController@index: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener carrito'
            ], 500);
        }
    }

    /**
     * Agregar curso al carrito
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'cursoID' => 'required|integer|exists:cursos,cursoID',
            ]);

            $user = $request->user();
            $result = $this->carritoService->agregar($user->id, $validated['cursoID']);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Curso agregado al carrito',
                'data' => $result['data']
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error CarritoController@store: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al agregar al carrito'
            ], 500);
        }
    }

    /**
     * Eliminar del carrito
     */
    public function destroy($id)
    {
        try {
            $user = request()->user();
            $result = $this->carritoService->eliminar($id, $user->id);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => $result['message']
            ]);
        } catch (\Throwable $e) {
            Log::error("Error CarritoController@destroy: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al eliminar del carrito'
            ], 500);
        }
    }

    /**
     * Vaciar carrito
     */
    public function vaciar(Request $request)
    {
        try {
            $user = $request->user();
            $result = $this->carritoService->vaciar($user->id);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => $result['message']
            ]);
        } catch (\Throwable $e) {
            Log::error("Error CarritoController@vaciar: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al vaciar carrito'
            ], 500);
        }
    }
}

