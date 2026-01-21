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
        Schema::create('cursos', function (Blueprint $table) {
            $table->increments('cursoID');
            $table->string('nombre', 200);
            $table->text('descripcion')->nullable();
            $table->enum('nivel', ['Básico', 'Intermedio', 'Avanzado']);
            $table->integer('cantidad_horas')->default(0);
            $table->decimal('precio', 10, 2)->default(0.00);
            $table->string('imagen_portada')->nullable();
            $table->text('objetivos')->nullable();
            $table->text('requisitos')->nullable();
            $table->enum('estado', ['Borrador', 'Publicado', 'Archivado'])->default('Borrador');
            $table->unsignedInteger('created_by')->nullable();
            $table->timestamps();

            $table->index('nivel');
            $table->index('estado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cursos');
    }
};

