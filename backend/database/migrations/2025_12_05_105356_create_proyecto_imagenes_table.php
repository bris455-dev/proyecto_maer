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
        Schema::create('proyecto_imagenes', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('proyectoID');
            $table->string('ruta', 500); // Ruta del archivo (imagen, STL, documento, etc.)
            $table->timestamp('created_at')->useCurrent();
            
            $table->index('proyectoID');
            
            // Foreign key opcional (si quieres usar constraints)
            // $table->foreign('proyectoID')->references('proyectoID')->on('proyecto')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proyecto_imagenes');
    }
};
