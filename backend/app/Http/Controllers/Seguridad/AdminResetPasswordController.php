<?php

namespace App\Http\Controllers\Seguridad;

use App\Http\Controllers\Controller;
use App\Services\UserSecurityService;
use App\Helpers\RoleHelper;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class AdminResetPasswordController extends Controller
{
    protected UserSecurityService $securityService;

    public function __construct(UserSecurityService $securityService)
    {
        $this->securityService = $securityService;
    }

    /**
     * Listar todos los usuarios (solo info necesaria para tabla)
     * Para diseñadores (rol 2), solo retorna su propio usuario
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            // Si NO es administrador, solo mostrar su propio usuario
            if ($user && !RoleHelper::isAdmin($user)) {
                $usuarios = User::select('id', 'nombre', 'email', 'rolID', 'password_changed')
                    ->where('id', $user->id)
                    ->orderBy('nombre')
                    ->get();
            } else {
                // Para administrador, mostrar todos los usuarios
                $usuarios = User::select('id', 'nombre', 'email', 'rolID', 'password_changed')
                    ->orderBy('nombre')
                    ->get();
            }

            return response()->json([
                'status' => 'success',
                'data' => $usuarios
            ], 200);

        } catch (\Throwable $e) {
            Log::error("Error en AdminResetPasswordController@index: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener la lista de usuarios.',
            ], 500);
        }
    }

    /**
     * Resetear contraseña de un usuario a la genérica Maer1234$
     * Diseñadores solo pueden resetear su propia contraseña
     */
    public function resetPassword(int $userID, Request $request)
    {
        try {
            $user = $request->user();
            
            // Si NO es administrador, solo puede resetear su propia contraseña
            if ($user && !RoleHelper::isAdmin($user) && $userID != $user->id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No autorizado. Solo puede resetear su propia contraseña.',
                ], 403);
            }
            
            $result = $this->securityService->resetPasswordToGenericById($userID, $request->ip());

            if (!$result['success']) {
                $statusCode = $result['code'] ?? 400;
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                ], $statusCode);
            }

            return response()->json([
                'status' => 'success',
                'message' => $result['message'],
                'user_id' => $result['user_id']
            ], 200);

        } catch (\Throwable $e) {
            Log::error("Error en AdminResetPasswordController@resetPassword: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al resetear la contraseña.',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null
            ], 500);
        }
    }
}
