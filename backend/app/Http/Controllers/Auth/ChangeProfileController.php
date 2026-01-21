<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\UsuarioRol;

class ChangeProfileController extends Controller
{
    /**
     * Cambiar el perfil/rol activo del usuario
     */
    public function changeProfile(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Usuario no autenticado.'
                ], 401);
            }

            $validated = $request->validate([
                'usuarioRolID' => 'required|integer|exists:usuario_roles,id'
            ]);

            // Verificar que el usuarioRolID pertenece al usuario
            $usuarioRol = UsuarioRol::where('id', $validated['usuarioRolID'])
                ->where('usuarioID', $user->id)
                ->where('activo', true)
                ->first();

            if (!$usuarioRol) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'El perfil seleccionado no está disponible para este usuario.'
                ], 403);
            }

            // Actualizar el rol principal del usuario
            $user->rolID = $usuarioRol->rolID;
            if ($usuarioRol->empleadoID) {
                $user->empleadoID = $usuarioRol->empleadoID;
            }
            if ($usuarioRol->clienteID) {
                $user->clienteID = $usuarioRol->clienteID;
            }
            $user->save();

            // Obtener permisos del nuevo rol
            $permisos = DB::table('rolpermiso as rp')
                ->join('permiso as p', 'rp.permisoID', '=', 'p.permisoID')
                ->where('rp.rolID', $usuarioRol->rolID)
                ->select('p.nombreModulo', 'p.nombreSubmodulo')
                ->get()
                ->map(fn($p) => [
                    'nombreModulo'      => $p->nombreModulo,
                    'nombreSubmodulo'   => $p->nombreSubmodulo
                ])
                ->toArray();

            // Obtener todos los roles disponibles
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

            Log::info('ChangeProfileController - Perfil cambiado', [
                'usuario_id' => $user->id,
                'nuevo_rolID' => $usuarioRol->rolID,
                'usuarioRolID' => $validated['usuarioRolID']
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Perfil cambiado exitosamente.',
                'user' => [
                    'id' => $user->id,
                    'nombre' => $user->nombre,
                    'email' => $user->email,
                    'rolID' => $user->rolID,
                    'rolesDisponibles' => $rolesDisponibles,
                    'permissions' => $permisos
                ]
            ], 200);

        } catch (\Throwable $e) {
            Log::error('Error en ChangeProfileController@changeProfile: ' . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'Error al cambiar el perfil.',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null
            ], 500);
        }
    }
}

