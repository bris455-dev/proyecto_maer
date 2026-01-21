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
        Schema::create('categorias_inventario', function (Blueprint $table) {
            $table->increments('id');
            $table->string('nombre', 100)->unique();
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        // Insertar categorías iniciales
        DB::table('categorias_inventario')->insert([
            ['nombre' => 'Cerámicas', 'descripcion' => 'Materiales cerámicos para restauraciones', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Ceras', 'descripcion' => 'Ceras para modelado y encerado', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Resinas', 'descripcion' => 'Resinas acrílicas y composites', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Herramientas', 'descripcion' => 'Herramientas y utensilios dentales', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Materiales de Impresión', 'descripcion' => 'Materiales para toma de impresiones', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Otros', 'descripcion' => 'Otros materiales e implementos', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categorias_inventario');
    }
};

