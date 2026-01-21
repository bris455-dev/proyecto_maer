<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('carrito', function (Blueprint $table) {
            $table->increments('carritoID');
            $table->integer('usuarioID')->index();
            $table->unsignedInteger('cursoID')->index();
            $table->timestamps();

            $table->foreign('usuarioID')
                ->references('id')
                ->on('usuarios')
                ->onDelete('cascade');
                
            $table->foreign('cursoID')
                ->references('cursoID')
                ->on('cursos')
                ->onDelete('cascade');
                
            // Un usuario solo puede tener un curso una vez en el carrito
            $table->unique(['usuarioID', 'cursoID']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('carrito');
    }
};

