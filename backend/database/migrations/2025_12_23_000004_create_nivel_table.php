<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('nivel', function (Blueprint $table) {
            $table->increments('id');
            $table->string('nombre', 50)->unique();
            $table->text('descripcion')->nullable();
            $table->integer('orden')->default(0);
            $table->timestamps();
        });

        // Insertar datos iniciales
        DB::table('nivel')->insert([
            ['nombre' => 'Principiante', 'descripcion' => '0-6 meses de experiencia: Cursos de introducción a la interfaz', 'orden' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Intermedio', 'descripcion' => 'Conocimiento funcional: Diseño de puentes, primeros implantes, uso de add-ons', 'orden' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Avanzado', 'descripcion' => 'Dominio del flujo: Integración de Blender ↔ Exocad, Casos All-on-X, Diseño de Barras complejas', 'orden' => 3, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nivel');
    }
};

