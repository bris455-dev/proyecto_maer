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
        Schema::create('produccion_entrega_detalles', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('entrega_id');
            $table->unsignedInteger('producto_id');
            $table->decimal('cantidad', 10, 2);
            $table->decimal('precio_unitario', 10, 2)->default(0);
            $table->text('observaciones')->nullable();
            $table->timestamps();

            $table->foreign('entrega_id')->references('id')->on('produccion_entregas')->onDelete('cascade');
            $table->foreign('producto_id')->references('id')->on('productos_inventario')->onDelete('restrict');
            $table->index('entrega_id');
            $table->index('producto_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('produccion_entrega_detalles');
    }
};

