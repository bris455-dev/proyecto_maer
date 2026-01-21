<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Services\Estudiante\EstudiantePerfilService;

class EstudiantePerfilController extends Controller
{
    protected $perfilService;

    public function __construct(EstudiantePerfilService $perfilService)
    {
        $this->perfilService = $perfilService;
    }

    /**
     * Actualizar información del perfil (nombre, idioma, tema)
     */
    public function updatePerfil(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|string|max:255',
            'idioma' => 'sometimes|string|in:es,en',
            'tema' => 'sometimes|string|in:claro,oscuro,automatico'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        $result = $this->perfilService->updatePerfil($user->id, $request->only([
            'nombre',
            'idioma',
            'tema'
        ]));

        if ($result['success']) {
            return response()->json([
                'status' => 'success',
                'message' => 'Perfil actualizado correctamente',
                'user' => $result['user']
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => $result['message']
        ], 400);
    }

    /**
     * Cambiar contraseña del estudiante
     */
    public function cambiarContrasena(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'password_actual' => 'required|string',
            'password_nueva' => 'required|string|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/',
            'password_nueva_confirmacion' => 'required|string|same:password_nueva'
        ], [
            'password_nueva.regex' => 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial.',
            'password_nueva_confirmacion.same' => 'Las contraseñas no coinciden.'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        // Verificar contraseña actual
        if (!Hash::check($request->password_actual, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'La contraseña actual es incorrecta'
            ], 400);
        }

        $result = $this->perfilService->cambiarContrasena($user->id, $request->password_nueva);

        if ($result['success']) {
            return response()->json([
                'status' => 'success',
                'message' => 'Contraseña actualizada correctamente'
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => $result['message']
        ], 400);
    }

    /**
     * Actualizar preferencias de notificaciones
     */
    public function updateNotificaciones(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'notificaciones_email' => 'sometimes|boolean',
            'notificaciones_nuevos_cursos' => 'sometimes|boolean',
            'notificaciones_recordatorios' => 'sometimes|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        $result = $this->perfilService->updateNotificaciones($user->id, $request->only([
            'notificaciones_email',
            'notificaciones_nuevos_cursos',
            'notificaciones_recordatorios'
        ]));

        if ($result['success']) {
            return response()->json([
                'status' => 'success',
                'message' => 'Preferencias de notificaciones actualizadas correctamente',
                'user' => $result['user']
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => $result['message']
        ], 400);
    }

    /**
     * Obtener perfil completo del estudiante
     */
    public function getPerfil(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $user->id,
                'nombre' => $user->nombre,
                'email' => $user->email,
                'idioma' => $user->idioma ?? 'es',
                'tema' => $user->tema ?? 'claro',
                'notificaciones_email' => $user->notificaciones_email ?? true,
                'notificaciones_nuevos_cursos' => $user->notificaciones_nuevos_cursos ?? true,
                'notificaciones_recordatorios' => $user->notificaciones_recordatorios ?? false
            ]
        ]);
    }
}

