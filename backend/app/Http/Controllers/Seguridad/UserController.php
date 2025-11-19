<?php

namespace App\Http\Controllers\Seguridad;

use App\Http\Controllers\Controller;
use App\Services\UserCreationService;
use App\Services\UserListerService;
use App\Services\UserUpdaterService;
use App\Requests\Seguridad\CreateUsuarioRequest;
use App\Requests\User\UserUpdateRequest;
use App\DTOs\User\CreateUserDTO;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    protected UserCreationService $creationService;
    protected UserListerService $listerService;
    protected UserUpdaterService $updaterService;

    public function __construct(
        UserCreationService $creationService,
        UserListerService $listerService,
        UserUpdaterService $updaterService
    ) {
        $this->creationService = $creationService;
        $this->listerService = $listerService;
        $this->updaterService = $updaterService;
    }

    /**
     * ✅ Listar usuarios
     */
    public function index()
    {
        try {
            $users = $this->listerService->getAllUsers();

            return response()->json([
                'status' => 'success',
                'message' => 'Lista de usuarios obtenida correctamente.',
                'data' => $users
            ], 200);

        } catch (\Throwable $e) {
            Log::error('Error en UserController@index: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener la lista de usuarios.',
            ], 500);
        }
    }

    /**
     * ✅ Crear usuario (Empleado o Cliente)
     */
    public function store(CreateUsuarioRequest $request)
    {
        try {
            $validated = $request->validated();
            $dto = new CreateUserDTO($validated);

            // Servicio de creación
            $result = $this->creationService->create($dto, $request->ip());

            if (!$result['success']) {
                return response()->json([
                    'status'  => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status'  => 'success',
                'message' => 'Usuario creado correctamente. Contraseña temporal generada.',
                'data'    => $result['data']
            ], 201);

        } catch (\Throwable $e) {

            Log::error(
                'Error en UserController@store: ' . 
                $e->getMessage() . 
                ' — Linea: ' . $e->getLine()
            );

            return response()->json([
                'status'  => 'error',
                'message' => 'Error al crear el usuario.',
            ], 500);
        }
    }

    /**
     * ✅ Actualizar usuario
     */
    public function update(UserUpdateRequest $request, int $id)
    {
        try {
            $validated = $request->validated();

            $result = $this->updaterService->update($id, $validated, $request->ip());

            if (!$result['success']) {
                return response()->json([
                    'status'  => 'error',
                    'message' => $result['message']
                ], 404);
            }

            return response()->json([
                'status'  => 'success',
                'message' => 'Usuario actualizado correctamente.',
                'data'    => $result['data']
            ], 200);

        } catch (\Throwable $e) {

            Log::error(
                'Error en UserController@update: ' 
                . $e->getMessage() 
                . ' — Linea: ' . $e->getLine()
            );

            return response()->json([
                'status'  => 'error',
                'message' => 'Error al actualizar el usuario.',
            ], 500);
        }
    }
}
