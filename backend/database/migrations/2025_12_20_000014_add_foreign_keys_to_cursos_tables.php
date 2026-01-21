<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Agrega las foreign keys a usuarios que fueron comentadas temporalmente
     */
    public function up(): void
    {
        // Agregar foreign key a matriculas
        Schema::table('matriculas', function (Blueprint $table) {
            $table->foreign('usuarioID')
                ->references('id')
                ->on('usuarios')
                ->onDelete('cascade');
        });

        // Agregar foreign key a pagos
        Schema::table('pagos', function (Blueprint $table) {
            $table->foreign('usuarioID')
                ->references('id')
                ->on('usuarios')
                ->onDelete('cascade');
        });

        // Agregar foreign key a carrito
        Schema::table('carrito', function (Blueprint $table) {
            $table->foreign('usuarioID')
                ->references('id')
                ->on('usuarios')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('carrito', function (Blueprint $table) {
            $table->dropForeign(['usuarioID']);
        });

        Schema::table('pagos', function (Blueprint $table) {
            $table->dropForeign(['usuarioID']);
        });

        Schema::table('matriculas', function (Blueprint $table) {
            $table->dropForeign(['usuarioID']);
        });
    }
};
