<?php

namespace App\Http\Controllers\Seguridad;

use App\Http\Controllers\Controller;
use App\Requests\User\ChangePasswordRequest;
use App\Services\UserSecurityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class ChangePasswordController extends Controller
{
    protected UserSecurityService $securityService;

    public function __construct(UserSecurityService $securityService)
    {
        $this->securityService = $securityService;
    }

    /**
     * Cambiar contraseña propia (roles 2 y 3)
     */
    public function update(ChangePasswordRequest $request)
    {
        try {
            $user = $request->user();
            $validated = $request->validated();

            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'La contraseña actual es incorrecta.',
                ], 400);
            }

            $result = $this->securityService->changePassword(
                $user,
                $validated['new_password'],
                $request->ip()
            );

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Contraseña actualizada correctamente.',
            ], 200);

        } catch (\Throwable $e) {
            Log::error('Error en ChangePasswordController@update: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar la contraseña.',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Resetear contraseña de cualquier usuario (solo rol 1)
     * Admin puede resetear la contraseña a 'Maer1234$'
     */
    public function adminReset(Request $request, $userID)
    {
        try {
            if (!is_numeric($userID)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'ID de usuario inválido.',
                ], 400);
            }

            $result = $this->securityService->resetPasswordToGenericById((int)$userID, $request->ip());

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
                'user_id' => $result['user_id'],
                'default_password' => $result['default_password']
            ], 200);

        } catch (\Throwable $e) {
            Log::error('Error en ChangePasswordController@adminReset: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al restablecer la contraseña.',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Buscar usuarios por nombre (solo rol 1)
     * Devuelve datos limitados para la tabla de administración
     */
    public function searchUsersByName(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|min:2'
            ]);

            $name = $request->query('name');
            $usuarios = $this->securityService->searchUsersByName($name);

            // Registrar búsqueda en bitácora
            $this->securityService->registrarBusqueda(
                $request->user(),
                "El usuario buscó: {$name}",
                $request->ip()
            );

            return response()->json([
                'status' => 'success',
                'data' => $usuarios
            ]);

        } catch (\Throwable $e) {
            Log::error("Error en ChangePasswordController@searchUsersByName: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al realizar la búsqueda.',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Obtener la información del usuario autenticado para gestión de su propia contraseña
     */
    public function getOwnUserForReset(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Usuario no autenticado.',
                ], 401);
            }

            return response()->json([
                'status' => 'success',
                'data' => [$user->only(['id', 'nombre', 'email', 'rolID', 'is_locked', 'password_changed'])]
            ]);

        } catch (\Throwable $e) {
            Log::error("Error en ChangePasswordController@getOwnUserForReset: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener la información del usuario.',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
