<?php

namespace App\Http\Controllers\Cursos;

use App\Http\Controllers\Controller;
use App\Services\MatriculaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MatriculaController extends Controller
{
    protected MatriculaService $matriculaService;

    public function __construct(MatriculaService $matriculaService)
    {
        $this->matriculaService = $matriculaService;
    }

    /**
     * Obtener matrículas del usuario
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $result = $this->matriculaService->getByUsuario($user->id);

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
            Log::error("Error MatriculaController@index: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener matrículas'
            ], 500);
        }
    }

    /**
     * Matricularse en un curso
     */
    public function store(Request $request)
    {
        try {
            $user = $request->user();
            $validated = $request->validate([
                'cursoID' => 'required|integer|exists:cursos,cursoID',
            ]);

            $result = $this->matriculaService->create($validated['cursoID'], $user->id);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Matrícula realizada correctamente',
                'data' => $result['data']
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error MatriculaController@store: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al realizar matrícula'
            ], 500);
        }
    }

    /**
     * Verificar acceso a curso
     */
    public function verificarAcceso(Request $request, $cursoID)
    {
        try {
            $user = $request->user();
            $tieneAcceso = $this->matriculaService->tieneAcceso($cursoID, $user->id);

            return response()->json([
                'status' => 'success',
                'tiene_acceso' => $tieneAcceso
            ]);
        } catch (\Throwable $e) {
            Log::error("Error MatriculaController@verificarAcceso: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al verificar acceso'
            ], 500);
        }
    }
}

