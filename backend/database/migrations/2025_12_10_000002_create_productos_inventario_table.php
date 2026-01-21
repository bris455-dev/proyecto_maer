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
        Schema::create('productos_inventario', function (Blueprint $table) {
            $table->increments('id');
            $table->string('codigo', 50)->unique();
            $table->string('nombre', 200);
            $table->text('descripcion')->nullable();
            $table->unsignedInteger('categoria_id');
            $table->string('unidad_medida', 20)->default('unidad'); // unidad, kg, litro, etc.
            $table->decimal('stock_actual', 10, 2)->default(0);
            $table->decimal('stock_minimo', 10, 2)->default(0);
            $table->decimal('stock_maximo', 10, 2)->nullable();
            $table->decimal('precio_unitario', 10, 2)->default(0);
            $table->string('proveedor', 200)->nullable();
            $table->string('ubicacion', 100)->nullable(); // Almacén, estante, etc.
            $table->boolean('activo')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('categoria_id')->references('id')->on('categorias_inventario')->onDelete('restrict');
            // Foreign key a usuarios - usando id como clave primaria
            $table->foreign('created_by')->references('id')->on('usuarios')->onDelete('set null');
            $table->index('codigo');
            $table->index('categoria_id');
            $table->index('activo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('productos_inventario');
    }
};

