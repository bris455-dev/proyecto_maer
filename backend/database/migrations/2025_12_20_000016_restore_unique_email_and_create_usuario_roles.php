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
        // 1. Restaurar índice único en email (ya debería estar limpio de duplicados)
        try {
            Schema::table('usuarios', function (Blueprint $table) {
                $table->unique('email', 'usuarios_email_unique');
            });
        } catch (\Exception $e) {
            // Si ya existe, continuar
            \Log::info('Índice único de email ya existe o no se pudo crear: ' . $e->getMessage());
        }
        
        // 2. Crear tabla de relación usuario-rol (muchos a muchos)
        Schema::create('usuario_roles', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('usuarioID');
            $table->unsignedInteger('rolID');
            $table->unsignedInteger('empleadoID')->nullable();
            $table->unsignedInteger('clienteID')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            
            $table->unique(['usuarioID', 'rolID', 'empleadoID', 'clienteID'], 'usuario_rol_unique');
            $table->index('usuarioID');
            $table->index('rolID');
        });
        
        // 3. Migrar datos existentes de usuarios a usuario_roles
        // Cada usuario existente se convierte en un registro en usuario_roles
        $usuarios = DB::table('usuarios')->whereNotNull('rolID')->get();
        foreach ($usuarios as $usuario) {
            DB::table('usuario_roles')->insert([
                'usuarioID' => $usuario->id,
                'rolID' => $usuario->rolID,
                'empleadoID' => $usuario->empleadoID,
                'clienteID' => $usuario->clienteID,
                'activo' => true,
                'created_at' => $usuario->created_at ?? now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('usuario_roles');
        
        Schema::table('usuarios', function (Blueprint $table) {
            $table->dropUnique('usuarios_email_unique');
        });
    }
};

