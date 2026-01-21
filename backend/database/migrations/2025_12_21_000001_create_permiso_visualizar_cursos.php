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
        // Crear permiso "visualizar" para Cursos
        $permisoExistente = DB::table('permiso')
            ->where('nombreModulo', 'Cursos')
            ->where('nombreSubmodulo', 'visualizar')
            ->first();

        if (!$permisoExistente) {
            $permisoID = DB::table('permiso')->insertGetId([
                'nombreModulo' => 'Cursos',
                'nombreSubmodulo' => 'visualizar'
            ]);

            // Asignar este permiso a todos los roles que tienen acceso a Cursos (Básico, Intermedio o Avanzado)
            // Buscar roles que tienen permisos de Cursos
            $rolesConCursos = DB::table('rolpermiso as rp')
                ->join('permiso as p', 'rp.permisoID', '=', 'p.permisoID')
                ->where('p.nombreModulo', 'Cursos')
                ->whereIn('p.nombreSubmodulo', ['Básico', 'Intermedio', 'Avanzado'])
                ->select('rp.rolID')
                ->distinct()
                ->pluck('rolID');

            // Asignar el permiso "visualizar" a estos roles
            foreach ($rolesConCursos as $rolID) {
                $existe = DB::table('rolpermiso')
                    ->where('rolID', $rolID)
                    ->where('permisoID', $permisoID)
                    ->exists();

                if (!$existe) {
                    DB::table('rolpermiso')->insert([
                        'rolID' => $rolID,
                        'permisoID' => $permisoID
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
        // Eliminar el permiso "visualizar" de Cursos
        $permiso = DB::table('permiso')
            ->where('nombreModulo', 'Cursos')
            ->where('nombreSubmodulo', 'visualizar')
            ->first();

        if ($permiso) {
            // Eliminar relaciones en rolpermiso
            DB::table('rolpermiso')
                ->where('permisoID', $permiso->permisoID)
                ->delete();

            // Eliminar el permiso
            DB::table('permiso')
                ->where('permisoID', $permiso->permisoID)
                ->delete();
        }
    }
};

