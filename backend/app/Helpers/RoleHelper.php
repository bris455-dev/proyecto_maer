<?php

namespace App\Helpers;

use App\Models\User;
use App\Models\Rol;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class RoleHelper
{
    const ADMIN_ROLE_NAME = 'Administrador';
    const CACHE_TTL = 3600; // 1 hora

    /**
     * Obtiene el rolID del administrador desde la base de datos.
     * Cacha el resultado para mejorar el rendimiento.
     */
    public static function getAdminRoleID(): ?int
    {
        return Cache::remember('admin_role_id', self::CACHE_TTL, function () {
            $adminRole = Rol::where('nombreRol', self::ADMIN_ROLE_NAME)->first();
            return $adminRole ? $adminRole->rolID : null;
        });
    }

    /**
     * Verifica si el usuario es administrador.
     * Usa caché para mejorar el rendimiento.
     */
    public static function isAdmin(?User $user): bool
    {
        if (!$user || !$user->rolID) {
            return false;
        }
        
        $adminRoleID = self::getAdminRoleID();
        return $adminRoleID && $user->rolID == $adminRoleID;
    }

    /**
     * Obtiene el rolID de un rol por su nombre.
     * Cacha el resultado para mejorar el rendimiento.
     */
    public static function getRoleIDByName(string $roleName): ?int
    {
        return Cache::remember("role_id_{$roleName}", self::CACHE_TTL, function () use ($roleName) {
            $role = Rol::where('nombreRol', $roleName)->first();
            return $role ? $role->rolID : null;
        });
    }

    /**
     * Limpia la caché de roles.
     * Útil cuando se crean, actualizan o eliminan roles.
     */
    public static function clearRoleCache(): void
    {
        Cache::forget('admin_role_id');
        // Limpiar caché de todos los roles (si se necesita)
        // Cache::flush(); // Solo si es necesario limpiar todo
    }

    /**
     * Verifica si un usuario tiene un rol específico por nombre.
     */
    public static function hasRole(?User $user, string $roleName): bool
    {
        if (!$user || !$user->rolID) {
            return false;
        }
        
        $roleID = self::getRoleIDByName($roleName);
        return $roleID && $user->rolID == $roleID;
    }
}

