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
            $user = User::where('email', $validated['email'])->first();

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

            // 3. Login exitoso: Reiniciar intentos y obtener permisos
            $user->failed_attempts = 0;
            $user->is_locked = 0;
            $user->lock_expires_at = null;
            $user->save();

            $permisos = DB::table('rolpermiso as rp')
                ->join('permiso as p', 'rp.permisoID', '=', 'p.permisoID')
                ->where('rp.rolID', $user->rolID)
                ->select('p.nombreModulo', 'p.nombreSubmodulo')
                ->get();

            $permissions = $permisos->map(fn($p) => [
                'nombreModulo'      => $p->nombreModulo,
                'nombreSubmodulo'   => $p->nombreSubmodulo
            ])->toArray();

            $userData = [
                'id'                => $user->id,
                'nombre'            => $user->nombre,
                'email'             => $user->email,
                'password_changed'  => $user->password_changed,
                'rolID'             => $user->rolID,
                'permissions'       => $permissions // 🔑 Permisos incluidos
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
