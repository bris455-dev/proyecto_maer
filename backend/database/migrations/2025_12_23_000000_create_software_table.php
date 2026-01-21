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
        Schema::create('software', function (Blueprint $table) {
            $table->increments('id');
            $table->string('nombre', 100)->unique();
            $table->text('descripcion')->nullable();
            $table->integer('orden')->default(0);
            $table->timestamps();
        });

        // Insertar datos iniciales
        DB::table('software')->insert([
            ['nombre' => 'Exocad', 'descripcion' => 'Para flujo de trabajo guiado y restauraciones estándar', 'orden' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Blender for Dental', 'descripcion' => 'Para personalización, manipulación de mallas y trabajos estéticos', 'orden' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Integración (Exocad ↔ Blender)', 'descripcion' => 'Para flujos de trabajo avanzados que usan ambos', 'orden' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Independiente del Software', 'descripcion' => 'Para cursos de teoría como anatomía o gestión de laboratorio', 'orden' => 4, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('software');
    }
};

