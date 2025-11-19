<?php

namespace App\Http\Controllers\Seguridad;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\UserStatusService;
use App\DTOs\Seguridad\ChangeUserStatusDTO; // ⚡ Asegúrate de importar el DTO
use Illuminate\Support\Facades\Log;

class UserStatusController extends Controller
{
    protected UserStatusService $statusService;

    public function __construct(UserStatusService $statusService)
    {
        $this->statusService = $statusService;
    }

    /**
     * Toggle estado de un usuario (activar/desactivar)
     */
    public function toggleEstado(Request $request, int $id)
    {
        try {
            $dto = new ChangeUserStatusDTO(array_merge($request->all(), ['id' => $id]));

            $result = $this->statusService->toggleEstado($dto, $request->ip());

            $status = $result['success'] ? 'success' : 'error';
            $code = $result['success'] ? 200 : 404;

            return response()->json([
                'status' => $status,
                'message' => $result['message']
            ], $code);

        } catch (\Throwable $e) {
            Log::error('Error en UserStatusController@toggleEstado: ' . $e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'Error al cambiar el estado del usuario.',
            ], 500);
        }
    }
}
