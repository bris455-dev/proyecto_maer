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
        Schema::create('pagos', function (Blueprint $table) {
            $table->increments('pagoID');
            $table->unsignedInteger('matriculaID')->nullable()->index();
            $table->integer('usuarioID')->index();
            $table->string('numero_transaccion', 100)->unique();
            $table->enum('metodo_pago', ['Tarjeta', 'PayPal', 'Yape', 'Plin'])->default('Tarjeta');
            $table->decimal('monto', 10, 2);
            $table->enum('estado', ['Pendiente', 'Completado', 'Fallido', 'Reembolsado'])->default('Pendiente');
            $table->text('datos_transaccion')->nullable(); // JSON con datos de la transacción
            $table->text('notas')->nullable();
            $table->timestamps();

            $table->foreign('matriculaID')
                ->references('matriculaID')
                ->on('matriculas')
                ->onDelete('set null');
                
            $table->foreign('usuarioID')
                ->references('id')
                ->on('usuarios')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pagos');
    }
};

