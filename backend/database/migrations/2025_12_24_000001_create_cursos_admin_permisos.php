<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Crea los permisos del módulo Cursos para administradores:
     * - Dashboard (vista principal)
     * - Reportes de Contenido
     * - Gestión de Metadatos
     * 
     * Asigna todos estos permisos al rol 1 (Administrador)
     */
    public function up(): void
    {
        $permisos = [
            ['nombreModulo' => 'Cursos', 'nombreSubmodulo' => 'Dashboard'],
            ['nombreModulo' => 'Cursos', 'nombreSubmodulo' => 'Reportes de Contenido'],
            ['nombreModulo' => 'Cursos', 'nombreSubmodulo' => 'Gestión de Metadatos'],
        ];

        foreach ($permisos as $permiso) {
            $permisoExistente = DB::table('permiso')
                ->where('nombreModulo', $permiso['nombreModulo'])
                ->where('nombreSubmodulo', $permiso['nombreSubmodulo'])
                ->first();

            if (!$permisoExistente) {
                $permisoID = DB::table('permiso')->insertGetId($permiso);

                // Asignar a Admin (rol 1)
                $rolAdmin = DB::table('rol')->where('rolID', 1)->first();
                if ($rolAdmin) {
                    $existe = DB::table('rolpermiso')
                        ->where('rolID', 1)
                        ->where('permisoID', $permisoID)
                        ->first();
                    
                    if (!$existe) {
                        DB::table('rolpermiso')->insert([
                            'rolID' => 1,
                            'permisoID' => $permisoID
                        ]);
                    }
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
            'Dashboard',
            'Reportes de Contenido',
            'Gestión de Metadatos'
        ];

        foreach ($permisos as $submodulo) {
            $permiso = DB::table('permiso')
                ->where('nombreModulo', 'Cursos')
                ->where('nombreSubmodulo', $submodulo)
                ->first();

            if ($permiso) {
                // Eliminar relaciones con roles
                DB::table('rolpermiso')
                    ->where('permisoID', $permiso->permisoID)
                    ->delete();

                // Eliminar el permiso
                DB::table('permiso')
                    ->where('permisoID', $permiso->permisoID)
                    ->delete();
            }
        }
    }
};

