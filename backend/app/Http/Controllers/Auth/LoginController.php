<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Requests\Auth\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Services\MFAService;
use Throwable;

class LoginController extends Controller
{
    protected MFAService $mfaService;
    protected int $maxFailedAttempts = 3;

    public function __construct(MFAService $mfaService)
    {
        $this->mfaService = $mfaService;
    }

    /**
     * Validar credenciales y enviar código MFA (si aplica)
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = null;

        try {
            // Buscar usuario por email (ahora es único)
            $user = User::where('email', $validated['email'])->first();
            
            // Log para debugging
            Log::info('LoginController - Intentando login', [
                'email' => $validated['email'],
                'user_found' => $user ? $user->id : null,
                'password_check' => $user ? Hash::check($validated['password'], $user->password) : false,
            ]);

            // 1. Usuario no encontrado o contraseña incorrecta
            if (!$user || !Hash::check($validated['password'], $user->password)) {
                if ($user) {
                    $user->failed_attempts = ($user->failed_attempts ?? 0) + 1;
                    if ($user->failed_attempts >= $this->maxFailedAttempts) {
                        $user->is_locked = 1;
                        $user->lock_expires_at = now();
                    }
                    $user->save();
                    DB::table('bitacora')->insert([
                        'user_id'   => $user->id,
                        'accion'    => 'login_fallido',
                        'detalle'   => 'Credenciales inválidas. Intento #' . $user->failed_attempts,
                        'ip'        => $request->ip(),
                        'fecha_hora'=> now(),
                    ]);
                }

                return response()->json([
                    'status'    => 'error',
                    'message'   => 'Credenciales inválidas.'
                ], 401);
            }

            // 2. Usuario bloqueado
            if ($user->is_locked) {
                return response()->json([
                    'status'    => 'error',
                    'message'   => 'El usuario está desactivado o bloqueado. Contacta al administrador.'
                ], 403);
            }

            // 3. Login exitoso: Reiniciar intentos y obtener roles disponibles
            $user->failed_attempts = 0;
            $user->is_locked = 0;
            $user->lock_expires_at = null;
            $user->save();

            // Obtener todos los roles/perfiles activos del usuario
            $rolesDisponibles = DB::table('usuario_roles as ur')
                ->join('rol as r', 'ur.rolID', '=', 'r.rolID')
                ->where('ur.usuarioID', $user->id)
                ->where('ur.activo', true)
                ->select('ur.id as usuarioRolID', 'ur.rolID', 'r.nombreRol', 'ur.empleadoID', 'ur.clienteID')
                ->get()
                ->map(function($rol) {
                    return [
                        'usuarioRolID' => $rol->usuarioRolID,
                        'rolID' => $rol->rolID,
                        'nombreRol' => $rol->nombreRol,
                        'empleadoID' => $rol->empleadoID,
                        'clienteID' => $rol->clienteID,
                    ];
                })
                ->toArray();

            // Obtener permisos del rol principal (o el primero si no hay principal)
            $rolIDParaPermisos = $user->rolID ?? ($rolesDisponibles[0]['rolID'] ?? null);
            
            $permisos = [];
            if ($rolIDParaPermisos) {
                $permisos = DB::table('rolpermiso as rp')
                    ->join('permiso as p', 'rp.permisoID', '=', 'p.permisoID')
                    ->where('rp.rolID', $rolIDParaPermisos)
                    ->select('p.nombreModulo', 'p.nombreSubmodulo')
                    ->get()
                    ->map(fn($p) => [
                        'nombreModulo'      => $p->nombreModulo,
                        'nombreSubmodulo'   => $p->nombreSubmodulo
                    ])
                    ->toArray();
            }

            $userData = [
                'id'                => $user->id,
                'nombre'            => $user->nombre,
                'email'             => $user->email,
                'password_changed'  => $user->password_changed,
                'rolID'             => $user->rolID ?? ($rolesDisponibles[0]['rolID'] ?? null),
                'rolesDisponibles'  => $rolesDisponibles, // 🔑 Todos los roles/perfiles disponibles
                'permissions'       => $permisos // 🔑 Permisos del rol actual
            ];

            // 4. Primer inicio de sesión
            if ($user->password_changed == 0) {
                DB::table('bitacora')->insert([
                    'user_id'   => $user->id,
                    'accion'    => 'primer_inicio',
                    'detalle'   => 'Usuario debe cambiar su contraseña inicial antes de ingresar.',
                    'ip'        => $request->ip(),
                    'fecha_hora'=> now(),
                ]);

                return response()->json([
                    'status'    => 'first_login',
                    'message'   => 'Debe cambiar su contraseña antes de continuar.',
                    'user'      => $userData // Usamos el array completo $userData
                ], 200);
            }

            // 5. MFA requerido
            $this->mfaService->generateAndSendCode($user);

            DB::table('bitacora')->insert([
                'user_id'   => $user->id,
                'accion'    => 'mfa_enviado',
                'detalle'   => 'Código MFA enviado correctamente al correo.',
                'ip'        => $request->ip(),
                'fecha_hora'=> now(),
            ]);

            return response()->json([
                'status'    => 'mfa_required',
                'message'   => 'Se ha enviado un código MFA a tu correo electrónico. Por favor, ingrésalo.',
                'user'      => $userData // Usamos el array completo $userData
            ], 202);

        } catch (Throwable $e) {
            Log::error('Error en LoginController@login', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status'    => 'error',
                'message'   => 'Ocurrió un error al procesar el inicio de sesión.',
                'error'     => env('APP_DEBUG') ? $e->getMessage() : null,
                'file'      => env('APP_DEBUG') ? $e->getFile() : null,
                'line'      => env('APP_DEBUG') ? $e->getLine() : null,
            ], 500);
        }
    }
}
