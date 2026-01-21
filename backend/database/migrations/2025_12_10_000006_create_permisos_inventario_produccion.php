<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Permisos para Inventario
        $permisosInventario = [
            ['nombreModulo' => 'Inventario', 'nombreSubmodulo' => 'listar'],
            ['nombreModulo' => 'Inventario', 'nombreSubmodulo' => 'crear'],
            ['nombreModulo' => 'Inventario', 'nombreSubmodulo' => 'editar'],
            ['nombreModulo' => 'Inventario', 'nombreSubmodulo' => 'eliminar'],
        ];

        // Permisos para Producción
        $permisosProduccion = [
            ['nombreModulo' => 'Producción', 'nombreSubmodulo' => 'listar'],
            ['nombreModulo' => 'Producción', 'nombreSubmodulo' => 'crear'],
            ['nombreModulo' => 'Producción', 'nombreSubmodulo' => 'editar'],
            ['nombreModulo' => 'Producción', 'nombreSubmodulo' => 'eliminar'],
        ];

        $permisos = array_merge($permisosInventario, $permisosProduccion);

        foreach ($permisos as $permiso) {
            // Verificar si el permiso ya existe
            $existe = DB::table('permiso')
                ->where('nombreModulo', $permiso['nombreModulo'])
                ->where('nombreSubmodulo', $permiso['nombreSubmodulo'])
                ->first();

            if (!$existe) {
                $permisoId = DB::table('permiso')->insertGetId([
                    'nombreModulo' => $permiso['nombreModulo'],
                    'nombreSubmodulo' => $permiso['nombreSubmodulo']
                ]);

                // Asignar permisos al rol Administrador (rolID = 1)
                $existeRolPermiso = DB::table('rolpermiso')
                    ->where('rolID', 1)
                    ->where('permisoID', $permisoId)
                    ->first();

                if (!$existeRolPermiso) {
                    DB::table('rolpermiso')->insert([
                        'rolID' => 1,
                        'permisoID' => $permisoId
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $permisos = [
            ['nombreModulo' => 'Inventario', 'nombreSubmodulo' => 'listar'],
            ['nombreModulo' => 'Inventario', 'nombreSubmodulo' => 'crear'],
            ['nombreModulo' => 'Inventario', 'nombreSubmodulo' => 'editar'],
            ['nombreModulo' => 'Inventario', 'nombreSubmodulo' => 'eliminar'],
            ['nombreModulo' => 'Producción', 'nombreSubmodulo' => 'listar'],
            ['nombreModulo' => 'Producción', 'nombreSubmodulo' => 'crear'],
            ['nombreModulo' => 'Producción', 'nombreSubmodulo' => 'editar'],
            ['nombreModulo' => 'Producción', 'nombreSubmodulo' => 'eliminar'],
        ];

        foreach ($permisos as $permiso) {
            $permisoRow = DB::table('permiso')
                ->where('nombreModulo', $permiso['nombreModulo'])
                ->where('nombreSubmodulo', $permiso['nombreSubmodulo'])
                ->first();
            
            if ($permisoRow) {
                DB::table('rolpermiso')->where('permisoID', $permisoRow->permisoID)->delete();
                DB::table('permiso')->where('permisoID', $permisoRow->permisoID)->delete();
            }
        }
    }
};

