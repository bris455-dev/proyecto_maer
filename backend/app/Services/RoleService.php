<?php

namespace App\Services;

use App\Models\User;
use App\Models\Rol; // Si tienes una tabla separada de roles
use Illuminate\Support\Facades\Log;
use App\Services\BitacoraService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

class RoleService
{
    /**
     * 🔹 Asigna un rol a un usuario existente.
     */
    public function assignRole(int $userId, int $rolID): array
    {
        try {
            $user = User::findOrFail($userId);
            $user->rolID = $rolID;
            $user->save();

            BitacoraService::registrar($user, 'Asignación de rol', "Rol asignado: {$rolID}");

            return [
                'success' => true,
                'message' => 'Rol asignado correctamente al usuario.',
                'user' => $user
            ];
        } catch (ModelNotFoundException $e) {
            Log::warning("❌ Usuario no encontrado al intentar asignar rol (ID: {$userId})");

            return [
                'success' => false,
                'message' => 'Usuario no encontrado.'
            ];
        } catch (\Throwable $e) {
            Log::error("❌ Error en RoleService@assignRole: " . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Error al asignar el rol al usuario.'
            ];
        }
    }

    /**
     * 🔹 Obtiene todos los usuarios que tienen un rol específico.
     */
    public function getUsersByRole(int $rolID): array
    {
        try {
            $users = User::where('rolID', $rolID)->get();

            return [
                'success' => true,
                'data' => $users
            ];
        } catch (\Throwable $e) {
            Log::error("❌ Error en RoleService@getUsersByRole: " . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Error al obtener los usuarios por rol.'
            ];
        }
    }

    /**
     * 🔹 Cambia el rol de un usuario existente.
     */
    public function changeUserRole(int $userId, int $nuevoRolID): array
    {
        try {
            $user = User::findOrFail($userId);
            $rolAnterior = $user->rolID;

            $user->rolID = $nuevoRolID;
            $user->save();

            BitacoraService::registrar(
                $user,
                'Cambio de rol',
                "Rol anterior: {$rolAnterior}, nuevo rol: {$nuevoRolID}"
            );

            return [
                'success' => true,
                'message' => 'Rol de usuario actualizado correctamente.',
                'user' => $user
            ];
        } catch (ModelNotFoundException $e) {
            return [
                'success' => false,
                'message' => 'Usuario no encontrado.'
            ];
        } catch (\Throwable $e) {
            Log::error("❌ Error en RoleService@changeUserRole: " . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Error al cambiar el rol del usuario.'
            ];
        }
    }

    /**
     * 🔹 Obtiene todos los roles existentes.
     */
    public function getAllRoles()
    {
        try {
            return Rol::all();
        } catch (\Throwable $e) {
            Log::error("❌ Error en RoleService@getAllRoles: " . $e->getMessage());
            return [];
        }
    }

    /**
     * 🔹 Obtiene los permisos asociados a un rol.
     */
    public function getPermisosByRol(int $rolID)
    {
        try {
            $permisos = DB::table('rolpermiso')
                ->join('permiso', 'rolpermiso.permisoID', '=', 'permiso.permisoID')
                ->where('rolpermiso.rolID', $rolID)
                ->select('permiso.nombreModulo', 'permiso.nombreSubmodulo')
                ->get();

            return [
                'success' => true,
                'data' => $permisos
            ];
        } catch (\Throwable $e) {
            Log::error("❌ Error en RoleService@getPermisosByRol: " . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Error al obtener los permisos del rol.'
            ];
        }
    }
}
