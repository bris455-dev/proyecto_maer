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
        Schema::create('produccion', function (Blueprint $table) {
            $table->increments('id');
            $table->string('nombre', 100)->unique();
            $table->text('descripcion')->nullable();
            $table->integer('orden')->default(0);
            $table->timestamps();
        });

        // Insertar datos iniciales
        DB::table('produccion')->insert([
            ['nombre' => 'Fresado (Milling)', 'descripcion' => 'Cursos enfocados en geometrías óptimas para CNC', 'orden' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Impresión 3D', 'descripcion' => 'Cursos enfocados en orientación de malla y generación de soportes', 'orden' => 2, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('produccion');
    }
};

