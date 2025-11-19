<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTratamientosTable extends Migration
{
    public function up()
    {
        Schema::create('tratamiento', function (Blueprint $table) {
            $table->increments('tratamientoID');
            $table->string('nombre', 100)->unique();
            $table->decimal('precio', 8, 2)->default(10.00);
            $table->timestamps();
        });

        // seed defaults (puedes mover a Seeder)
        DB::table('tratamiento')->insert([
            ['nombre' => 'corona', 'precio' => 10.00, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'carilla', 'precio' => 10.00, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'puente', 'precio' => 10.00, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'incrustacion', 'precio' => 10.00, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'encerado', 'precio' => 7.00, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('tratamiento');
    }
}
