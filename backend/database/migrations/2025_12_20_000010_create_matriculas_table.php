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
        Schema::create('matriculas', function (Blueprint $table) {
            $table->increments('matriculaID');
            $table->unsignedInteger('cursoID')->index();
            $table->integer('usuarioID')->index();
            $table->enum('estado', ['Pendiente', 'Pagado', 'Cancelado', 'Expirado'])->default('Pendiente');
            $table->decimal('precio_pagado', 10, 2)->default(0.00);
            $table->date('fecha_matricula')->nullable();
            $table->date('fecha_expiracion')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();

            $table->foreign('cursoID')
                ->references('cursoID')
                ->on('cursos')
                ->onDelete('cascade');
                
            $table->foreign('usuarioID')
                ->references('id')
                ->on('usuarios')
                ->onDelete('cascade');
                
            // Un usuario solo puede matricularse una vez por curso
            $table->unique(['cursoID', 'usuarioID']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matriculas');
    }
};

