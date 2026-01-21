<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Intentar eliminar el índice único del email con diferentes nombres posibles
        // Laravel puede crear índices con diferentes nombres según la versión
        $indexNames = [
            'usuarios_email_unique',
            'email',
            'usuarios_email_unique_index'
        ];
        
        foreach ($indexNames as $indexName) {
            try {
                \DB::statement("ALTER TABLE usuarios DROP INDEX `{$indexName}`");
                \Log::info("Índice único '{$indexName}' eliminado exitosamente");
                break; // Si se eliminó exitosamente, salir del loop
            } catch (\Exception $e) {
                // Continuar con el siguiente nombre si este no existe
                continue;
            }
        }
        
        // Si ninguno de los nombres funcionó, intentar con el método de Schema
        try {
            Schema::table('usuarios', function (Blueprint $table) {
                $table->dropUnique(['email']);
            });
        } catch (\Exception $e) {
            \Log::info('No se encontró índice único en email, puede que ya no exista');
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('usuarios', function (Blueprint $table) {
            // Restaurar el índice único del email (si es necesario revertir)
            $table->unique('email');
        });
    }
};
