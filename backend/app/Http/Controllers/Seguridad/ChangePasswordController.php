<?php

namespace App\Http\Controllers\Seguridad;

use App\Http\Controllers\Controller;
use App\Requests\User\ChangePasswordRequest;
use App\Requests\User\AdminResetPasswordRequest;
use App\Services\UserSecurityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class ChangePasswordController extends Controller
{
    protected UserSecurityService $seguridadService;

    public function __construct(UserSecurityService $seguridadService)
    {
        $this->seguridadService = $seguridadService;
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

            $result = $this->seguridadService->changePassword(
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
     */
    public function adminReset(AdminResetPasswordRequest $request)
    {
        try {
            $validated = $request->validated();

            $user = null;

            if (!empty($validated['email'])) {
                $user = $this->seguridadService->getUserByEmail($validated['email']);
            } elseif (!empty($validated['name'])) {
                $user = $this->seguridadService->searchUsersByName($validated['name'])->first();
            }

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Usuario no encontrado.',
                ], 404);
            }

            $result = $this->seguridadService->resetPasswordToDefault($user, $request->ip());

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => "Contraseña restablecida correctamente a 12345678 para {$user->email}.",
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
     */
    public function searchUsersByName(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|min:2'
            ]);

            $name = $request->query('name');

            $usuarios = $this->seguridadService->searchUsersByName($name);

            // Bitácora
            $this->seguridadService->registrarBusqueda(
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
}
