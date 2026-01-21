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
        Schema::create('produccion_entregas', function (Blueprint $table) {
            $table->increments('id');
            $table->string('numero_entrega', 50)->unique();
            $table->unsignedBigInteger('usuario_asignado_id'); // Diseñador o técnico
            $table->unsignedBigInteger('usuario_entrega_id')->nullable(); // Quien entrega
            $table->date('fecha_entrega');
            $table->text('motivo')->nullable();
            $table->enum('estado', ['pendiente', 'entregado', 'cancelado'])->default('pendiente');
            $table->text('observaciones')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('usuario_asignado_id')->references('id')->on('usuarios')->onDelete('restrict');
            $table->foreign('usuario_entrega_id')->references('id')->on('usuarios')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('usuarios')->onDelete('set null');
            $table->index('numero_entrega');
            $table->index('usuario_asignado_id');
            $table->index('fecha_entrega');
            $table->index('estado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('produccion_entregas');
    }
};

