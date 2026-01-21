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
        Schema::create('aplicacion', function (Blueprint $table) {
            $table->increments('id');
            $table->string('nombre', 100)->unique();
            $table->text('descripcion')->nullable();
            $table->string('categoria', 50)->nullable(); // Restauración Fija, Implantes, Dispositivos, Estética Avanzada
            $table->integer('orden')->default(0);
            $table->timestamps();
        });

        // Insertar datos iniciales
        $aplicaciones = [
            // Restauración Fija
            ['nombre' => 'Coronas y Puentes', 'categoria' => 'Restauración Fija', 'orden' => 1],
            ['nombre' => 'Carillas, Inlays y Onlays', 'categoria' => 'Restauración Fija', 'orden' => 2],
            // Implantes
            ['nombre' => 'Pilares Personalizados (Custom Abutments)', 'categoria' => 'Implantes', 'orden' => 3],
            ['nombre' => 'Barras Atornilladas (Toronto / Estructuras Híbridas)', 'categoria' => 'Implantes', 'orden' => 4],
            ['nombre' => 'Guías Quirúrgicas', 'categoria' => 'Implantes', 'orden' => 5],
            // Dispositivos / Auxiliares
            ['nombre' => 'Férulas de Descarga (Splints)', 'categoria' => 'Dispositivos', 'orden' => 6],
            ['nombre' => 'Modelos de Impresión 3D (Preparación/Troquelado)', 'categoria' => 'Dispositivos', 'orden' => 7],
            ['nombre' => 'Diseño de Provisionales', 'categoria' => 'Dispositivos', 'orden' => 8],
            // Estética Avanzada
            ['nombre' => 'Digital Smile Design (DSD) y Wax-up estético', 'categoria' => 'Estética Avanzada', 'orden' => 9],
            ['nombre' => 'Renderizado Fotorrealista', 'categoria' => 'Estética Avanzada', 'orden' => 10],
        ];

        foreach ($aplicaciones as $aplicacion) {
            DB::table('aplicacion')->insert([
                'nombre' => $aplicacion['nombre'],
                'categoria' => $aplicacion['categoria'],
                'orden' => $aplicacion['orden'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('aplicacion');
    }
};

