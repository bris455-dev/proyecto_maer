<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Tabla de relación para facturas grupales (una factura puede tener múltiples proyectos)
     */
    public function up(): void
    {
        Schema::create('facturacion_proyectos', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('facturacionID')->index();
            $table->unsignedInteger('proyectoID')->index();
            $table->timestamps();

            // Índice único para evitar duplicados
            $table->unique(['facturacionID', 'proyectoID']);
            
            // Foreign keys
            $table->foreign('facturacionID')
                ->references('facturacionID')
                ->on('facturacion')
                ->onDelete('cascade');
                
            // Nota: La foreign key a proyecto se creará después si es necesario
            // Por ahora la omitimos para evitar problemas de tipos
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('facturacion_proyectos');
    }
};

