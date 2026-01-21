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
        Schema::create('movimientos_inventario', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('producto_id');
            $table->enum('tipo', ['entrada', 'salida', 'ajuste'])->default('salida');
            $table->decimal('cantidad', 10, 2);
            $table->decimal('stock_anterior', 10, 2);
            $table->decimal('stock_nuevo', 10, 2);
            $table->string('motivo', 500)->nullable();
            $table->string('referencia', 100)->nullable(); // Número de factura, orden, etc.
            $table->unsignedBigInteger('usuario_id')->nullable();
            $table->unsignedBigInteger('produccion_id')->nullable(); // Relación con producción
            $table->timestamps();

            $table->foreign('producto_id')->references('id')->on('productos_inventario')->onDelete('cascade');
            $table->foreign('usuario_id')->references('id')->on('usuarios')->onDelete('set null');
            $table->index('producto_id');
            $table->index('tipo');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movimientos_inventario');
    }
};

