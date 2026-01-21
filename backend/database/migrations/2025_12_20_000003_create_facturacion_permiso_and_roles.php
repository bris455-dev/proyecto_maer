<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Crea el permiso de Facturación y lo asigna a rol 1 (Admin) y rol 3 (Cliente)
     * SIN modificar otras tablas existentes
     */
    public function up(): void
    {
        // Insertar el permiso de Facturación
        $permisoID = DB::table('permiso')->insertGetId([
            'nombreModulo' => 'Facturación',
            'nombreSubmodulo' => 'Gestionar'
        ]);

        // Asignar permiso a rol 1 (Admin) - si existe
        $rolAdmin = DB::table('rol')->where('rolID', 1)->first();
        if ($rolAdmin) {
            DB::table('rolpermiso')->insert([
                'rolID' => 1,
                'permisoID' => $permisoID
            ]);
        }

        // Asignar permiso a rol 3 (Cliente) - si existe
        $rolCliente = DB::table('rol')->where('rolID', 3)->first();
        if ($rolCliente) {
            DB::table('rolpermiso')->insert([
                'rolID' => 3,
                'permisoID' => $permisoID
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Obtener el permisoID de Facturación
        $permiso = DB::table('permiso')
            ->where('nombreModulo', 'Facturación')
            ->where('nombreSubmodulo', 'Gestionar')
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
};

