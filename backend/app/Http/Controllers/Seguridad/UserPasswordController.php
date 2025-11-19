<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Requests\User\ChangePasswordRequest;
use App\Services\UserSecurityService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserPasswordController extends Controller
{
    protected UserSecurityService $securityService;

    public function __construct(UserSecurityService $securityService)
    {
        $this->securityService = $securityService;
    }

    /**
     * ✅ Permite al usuario autenticado cambiar su contraseña.
     */
    public function update(ChangePasswordRequest $request)
    {
        try {
            $user = $request->user(); // Obtener el usuario autenticado
            $validated = $request->validated();

            // 🔹 Validar que la contraseña actual coincida antes de usar el servicio
            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'La contraseña actual es incorrecta.',
                ], 400);
            }

            // 🔹 Cambiar la contraseña usando el servicio de seguridad
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
            Log::error('Error en UserPasswordController@update: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar la contraseña.',
            ], 500);
        }
    }
}
