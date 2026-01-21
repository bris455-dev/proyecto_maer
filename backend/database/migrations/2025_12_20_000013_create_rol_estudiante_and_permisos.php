<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Crea el rol Estudiante y los permisos de Cursos
     */
    public function up(): void
    {
        // Crear rol Estudiante (rolID 4)
        $rolEstudiante = DB::table('rol')->where('rolID', 4)->first();
        if (!$rolEstudiante) {
            DB::table('rol')->insert([
                'rolID' => 4,
                'nombreRol' => 'Estudiante'
            ]);
        }

        // Crear permisos para Cursos
        $permisosCursos = [
            ['nombreModulo' => 'Cursos', 'nombreSubmodulo' => 'Básico'],
            ['nombreModulo' => 'Cursos', 'nombreSubmodulo' => 'Intermedio'],
            ['nombreModulo' => 'Cursos', 'nombreSubmodulo' => 'Avanzado'],
        ];

        foreach ($permisosCursos as $permiso) {
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

                // Asignar a Estudiante (rol 4)
                $existeEstudiante = DB::table('rolpermiso')
                    ->where('rolID', 4)
                    ->where('permisoID', $permisoID)
                    ->first();
                if (!$existeEstudiante) {
                    DB::table('rolpermiso')->insert([
                        'rolID' => 4,
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
        // Eliminar permisos de Cursos
        $permisos = DB::table('permiso')
            ->where('nombreModulo', 'Cursos')
            ->get();

        foreach ($permisos as $permiso) {
            DB::table('rolpermiso')
                ->where('permisoID', $permiso->permisoID)
                ->delete();
            
            DB::table('permiso')
                ->where('permisoID', $permiso->permisoID)
                ->delete();
        }

        // Eliminar rol Estudiante (opcional, comentado para no perder datos)
        // DB::table('rol')->where('rolID', 4)->delete();
    }
};

