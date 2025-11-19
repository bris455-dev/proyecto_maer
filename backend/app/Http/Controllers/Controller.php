<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;

class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;

    /**
     * 🔹 Retorna una respuesta JSON estándar de éxito.
     */
    protected function successResponse(string $message, array $data = [], int $code = 200): JsonResponse
    {
        return response()->json(array_merge([
            'status'  => 'success',
            'message' => $message,
        ], $data), $code);
    }

    /**
     * 🔹 Retorna una respuesta JSON estándar de error.
     */
    protected function errorResponse(string $message, int $code = 400, ?string $error = null): JsonResponse
    {
        if ($error) {
            Log::error($error);
        }

        return response()->json([
            'status'  => 'error',
            'message' => $message,
            'error'   => env('APP_DEBUG') ? $error : null,
        ], $code);
    }

    /**
     * 🔹 Maneja excepciones de forma centralizada (opcional).
     */
    protected function handleException(\Throwable $e, string $contextMessage = 'Error interno'): JsonResponse
    {
        Log::error($contextMessage . ': ' . $e->getMessage(), [
            'trace' => $e->getTraceAsString(),
        ]);

        return response()->json([
            'status'  => 'error',
            'message' => $contextMessage,
            'error'   => env('APP_DEBUG') ? $e->getMessage() : null,
        ], 500);
    }
}
