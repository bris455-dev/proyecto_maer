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
        Schema::create('facturacion', function (Blueprint $table) {
            $table->increments('facturacionID');
            $table->unsignedInteger('proyectoID')->nullable()->index(); // Nullable para facturas grupales
            $table->unsignedInteger('clienteID')->index();
            $table->enum('tipo', ['Individual', 'Grupal'])->default('Individual');
            $table->string('numero_factura', 50)->unique();
            $table->date('fecha_emision');
            $table->date('fecha_vencimiento')->nullable();
            $table->decimal('subtotal', 10, 2)->default(0.00);
            $table->decimal('impuesto', 10, 2)->default(0.00);
            $table->decimal('descuento', 10, 2)->default(0.00);
            $table->decimal('total', 10, 2)->default(0.00);
            $table->enum('estado', ['Pendiente', 'Emitida', 'Pagada', 'Cancelada'])->default('Pendiente');
            $table->text('observaciones')->nullable();
            $table->unsignedInteger('created_by')->nullable();
            $table->timestamps();

            // Índices para mejorar rendimiento
            $table->index('fecha_emision');
            $table->index('estado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('facturacion');
    }
};

