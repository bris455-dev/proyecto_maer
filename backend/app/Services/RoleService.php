<?php

namespace App\Services;

use App\Models\User;
use App\Models\Rol;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

class RoleService
{
    /**
     * 🟢 Asignar rol a un usuario
     */
    public function assignRole(int $userId, int $rolID): array
    {
        try {
            $user = User::findOrFail($userId);
            $user->rolID = $rolID;
            $user->save();

            return [
                'success' => true,
                'message' => 'Rol asignado al usuario correctamente.',
                'data' => $user
            ];

        } catch (ModelNotFoundException $e) {
            return ['success'=>false,'message'=>'Usuario no encontrado'];
        } catch (\Throwable $e){
            Log::error("RoleService@assignRole: ".$e->getMessage());
            return ['success'=>false,'message'=>'Error al asignar rol'];
        }
    }


    /**
     * 🟢 Obtener todos los usuarios por rol
     */
    public function getUsersByRole(int $rolID): array
    {
        try {
            return [
                'success'=>true,
                'data'=>User::where('rolID',$rolID)->get()
            ];

        } catch (\Throwable $e){
            Log::error("RoleService@getUsersByRole: ".$e->getMessage());
            return ['success'=>false,'message'=>'Error al obtener usuarios'];
        }
    }


    /**
     * 🟢 Cambiar rol de un usuario
     */
    public function changeUserRole(int $userId, int $nuevoRolID): array
    {
        try {
            $user = User::findOrFail($userId);
            $rolAnterior = $user->rolID;

            $user->rolID = $nuevoRolID;
            $user->save();

            return [
                'success' => true,
                'message' => "Rol actualizado de {$rolAnterior} → {$nuevoRolID}",
                'data' => $user
            ];

        } catch (ModelNotFoundException $e){
            return ['success'=>false,'message'=>'Usuario no encontrado'];
        } catch (\Throwable $e){
            Log::error("RoleService@changeUserRole: ".$e->getMessage());
            return ['success'=>false,'message'=>'Error al actualizar rol de usuario'];
        }
    }


    /**
     * 🟢 Traer roles
     */
    public function getAllRoles()
    {
        return Rol::with('permisos')->get(); // AHORA VIENE CON PERMISOS DIRECTOS
    }


    /**
     * 🟢 Obtener permisos vía relación belongsToMany()
     */
    public function getPermisosByRol(int $rolID): array
    {
        try {
            $rol = Rol::with('permisos')->findOrFail($rolID);

            return [
                'success'=>true,
                'data'=>$rol->permisos
            ];

        } catch (ModelNotFoundException $e){
            return ['success'=>false,'message'=>'Rol no encontrado'];
        } catch (\Throwable $e){
            Log::error("RoleService@getPermisosByRol: ".$e->getMessage());
            return ['success'=>false,'message'=>'Error al obtener permisos'];
        }
    }


    /**
     * 🟢 Asignar permisos a rol (admite crear/actualizar)
     */
    public function syncPermisos(int $rolID, array $permisos): array
    {
        try {
            $rol = Rol::findOrFail($rolID);
            $rol->permisos()->sync($permisos);  // <<<< ESTA ES LA IMPLEMENTACIÓN IDEAL

            return [
                'success'=>true,
                'message'=>'Permisos actualizados',
                'data'=>$rol->permisos
            ];

        } catch (\Throwable $e){
            Log::error("RoleService@syncPermisos: ".$e->getMessage());
            return ['success'=>false,'message'=>'Error al actualizar permisos'];
        }
    }
}
