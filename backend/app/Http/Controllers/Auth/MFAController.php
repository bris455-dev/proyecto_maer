<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Requests\Auth\MFARequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class MFAController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function verifyMfa(MFARequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $ip = $request->ip();

            $result = $this->authService->verifyMfaCode($data, $ip);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                ], $result['code'] ?? 401);
            }

            // El $result['user'] viene del AuthService como array
            $user = $result['user'];

            // Obtener permisos del rol
            $permisos = DB::table('rolpermiso as rp')
                ->join('permiso as p', 'rp.permisoID', '=', 'p.permisoID')
                ->where('rp.rolID', $user['rolID'])
                ->select('p.nombreModulo', 'p.nombreSubmodulo')
                ->get();

            // Agregamos permisos al array de usuario
            $user['permissions'] = $permisos->map(fn($p) => [
                'nombreModulo'      => $p->nombreModulo,
                'nombreSubmodulo'   => $p->nombreSubmodulo
            ])->toArray();

            // Devolvemos el usuario COMPLETO (con permissions) junto con el token
            return response()->json([
                'status'    => 'success',
                'message'   => 'Inicio de sesión exitoso.',
                'user'      => $user, // 🔑 ¡Aquí va el objeto con permissions!
                'token'     => $result['token'] ?? '',
            ], 200);

        } catch (Throwable $e) {
            Log::error('Error en MFAController@verifyMfa: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Ocurrió un error interno al verificar el código MFA.',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null
            ], 500);
        }
    }
}

