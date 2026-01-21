<?php

namespace App\Http\Controllers\Seguridad;

use App\Http\Controllers\Controller;
use App\Services\UserCreationService;
use App\Services\UserListerService;
use App\Services\UserUpdaterService;
use App\Requests\Seguridad\CreateUsuarioRequest;
use App\Requests\User\UserUpdateRequest;
use App\DTOs\User\CreateUserDTO;
use App\Helpers\RoleHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

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
        $this->listerService   = $listerService;
        $this->updaterService  = $updaterService;
    }

    /**
     * Listar todos los usuarios
     * Para diseñadores (rol 2), solo retorna empleados (rol 2) para seleccionar al crear proyectos
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            // Si es administrador, mostrar todos los usuarios
            if (RoleHelper::isAdmin($user)) {
                $usuarios = $this->listerService->getAllUsers();
            } else {
                // Para usuarios no admin, solo mostrar su propio usuario
                $usuarios = \App\Models\User::with('rol')
                    ->where('id', $user->id)
                    ->get()
                    ->map(function($u) {
                        return [
                            'id' => $u->id,
                            'nombre' => $u->nombre,
                            'email' => $u->email,
                            'rolID' => $u->rolID,
                            'empleadoID' => $u->empleadoID,
                            'clienteID' => $u->clienteID,
                            'rol' => $u->rol ? [
                                'rolID' => $u->rol->rolID,
                                'nombre' => $u->rol->nombreRol
                            ] : null
                        ];
                    })
                    ->toArray();
            }
            
            return response()->json([
                'status' => 'success',
                'data' => $usuarios
            ], 200);
        } catch (\Throwable $e) {
            Log::error("❌ Error al listar usuarios: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener la lista de usuarios.'
            ], 500);
        }
    }

    /**
     * 🔥 Crear usuarios desde React (empleado o cliente)
     */
   public function store(CreateUsuarioRequest $request)
{
    try {
        $data = $request->validated();

        $dtoData = [
            'email' => $data['email'],
            'rolID' => $data['rolID'],
            'tipo'  => $data['tipo']
        ];

        if ($data['tipo'] === 'empleado') {
            $dtoData['empleado_nombre'] = $data['nombre'];
            $dtoData['empleado_dni']    = $data['dni'];
            $dtoData['empleado_cargo']  = $data['cargo'];
            $dtoData['empleado_email']  = $data['email'];
            $dtoData['empleado_estado'] = 1;
        }

        if ($data['tipo'] === 'cliente') {
            $dtoData['cliente_nombre']    = $data['nombre_cliente']; // <--- CORRECCIÓN
            $dtoData['cliente_dni_ruc']   = $data['dni_ruc'];
            $dtoData['cliente_direccion'] = $data['direccion'];
            $dtoData['cliente_pais']      = $data['pais'];
            $dtoData['cliente_email']     = $data['email'];
            $dtoData['cliente_estado']    = 1;
        }

        $dto = new CreateUserDTO($dtoData);

        $result = $this->creationService->create($dto, $request->ip());

        if (!$result['success']) {
            return response()->json([
                'status'  => 'error',
                'message' => $result['message'] ?? 'Error en el proceso de creación del usuario.',
                'debug'   => $result['debug'] ?? null
            ], 500);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Usuario creado exitosamente',
            'password_temporal' => $result['password_temporal'], // ✅ ahora coincide
            'data'    => $result['data']
        ], 201);

    } catch (\Illuminate\Validation\ValidationException $e) {
        \Log::error("❌ Error de validación al crear usuario: " . $e->getMessage());
        return response()->json([
            'status'  => 'error',
            'message' => 'Error de validación: ' . $e->getMessage(),
            'errors'  => $e->errors()
        ], 422);
    } catch (\Throwable $e) {
        \Log::error("❌ Error al crear usuario: " . $e->getMessage() . " - " . $e->getTraceAsString());

        return response()->json([
            'status'  => 'error',
            'message' => 'Error en el proceso de creación del usuario: ' . (env('APP_DEBUG') ? $e->getMessage() : 'Error interno del servidor.')
        ], 500);
    }
}



    /**
     * Actualizar usuarios
     */
    public function update(UserUpdateRequest $request, int $id)
    {
        try {
            $result = $this->updaterService->update($id,$request->validated(),$request->ip());

            return $result['success']
                ? response()->json(['status'=>'success','data'=>$result['data']],200)
                : response()->json(['status'=>'error','message'=>$result['message']],404);

        } catch (\Throwable $e) {
            return response()->json(['status'=>'error','message'=>"Error al actualizar"],500);
        }
    }

    /**
     * Eliminar usuario
     */
    public function destroy(int $id)
    {
        try {
            $user = \App\Models\User::find($id);
            
            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Usuario no encontrado.'
                ], 404);
            }

            // Verificar si tiene proyectos asociados
            $tieneProyectos = false;
            
            // Si el usuario tiene empleadoID, verificar proyectos como diseñador
            if ($user->empleadoID) {
                $tieneProyectos = \App\Models\Proyecto::where('empleadoID', $user->empleadoID)->exists();
            }
            
            // Si el usuario tiene clienteID, verificar proyectos como cliente
            if (!$tieneProyectos && $user->clienteID) {
                $tieneProyectos = \App\Models\Proyecto::where('clienteID', $user->clienteID)->exists();
            }

            if ($tieneProyectos) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No se puede eliminar el usuario porque tiene proyectos asociados.'
                ], 400);
            }

            // Eliminar empleado o cliente asociado si existe
            if ($user->empleadoID) {
                \App\Models\Empleado::where('empleadoID', $user->empleadoID)->delete();
            }
            if ($user->clienteID) {
                \App\Models\Cliente::where('clienteID', $user->clienteID)->delete();
            }

            // Eliminar usuario
            $user->delete();

            // Registrar en bitácora
            if (auth()->check()) {
                try {
                    app(\App\Services\BitacoraService::class)->registrar(
                        auth()->user(),
                        'Eliminación de usuario',
                        "Usuario {$user->email} eliminado.",
                        request()->ip()
                    );
                } catch (\Throwable $e) {
                    Log::warning("Fallo en Bitácora (destroy): " . $e->getMessage());
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Usuario eliminado correctamente.'
            ], 200);

        } catch (\Throwable $e) {
            Log::error("❌ Error al eliminar usuario ID {$id}: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al eliminar el usuario.'
            ], 500);
        }
    }

}
