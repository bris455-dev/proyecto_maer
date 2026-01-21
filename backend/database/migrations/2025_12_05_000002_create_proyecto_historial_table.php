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
        Schema::create('proyecto_historial', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('proyectoID');
            $table->unsignedInteger('userID')->nullable();
            $table->string('usuario_nombre', 150);
            $table->text('nota');
            $table->json('archivos')->nullable(); // Array de rutas de archivos (imágenes, STL, etc.)
            $table->timestamp('created_at')->useCurrent();
            
            $table->index('proyectoID');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proyecto_historial');
    }
};

