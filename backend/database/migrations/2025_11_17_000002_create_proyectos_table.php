<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProyectosTable extends Migration
{
    public function up()
    {
        Schema::create('proyecto', function (Blueprint $table) {
            $table->increments('proyectoID');
            $table->string('paciente', 150);
            $table->unsignedInteger('clienteID')->nullable()->index();
            $table->unsignedInteger('empleadoID')->nullable()->index(); // diseñador asignado (opcional)
            $table->date('fecha_entrega')->nullable();
            $table->text('notas')->nullable();
            $table->json('odontograma')->nullable(); // JSON: [{"tooth":"45","tratamiento":"corona"},...]
            $table->json('images')->nullable(); // array de rutas
            $table->decimal('total', 10, 2)->default(0.00);
            $table->tinyInteger('estado')->default(1); // 1 = activo, 0 = cerrado/completado (ajustable)
            $table->timestamps();

            // FK opcionales (si quieres usar constraints)
            // $table->foreign('clienteID')->references('clienteID')->on('cliente');
            // $table->foreign('empleadoID')->references('empleadoID')->on('empleado');
        });
    }

    public function down()
    {
        Schema::dropIfExists('proyecto');
    }
}
