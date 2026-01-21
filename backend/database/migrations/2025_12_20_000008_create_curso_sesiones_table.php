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
        Schema::create('curso_sesiones', function (Blueprint $table) {
            $table->increments('sesionID');
            $table->unsignedInteger('cursoID')->index();
            $table->string('nombre', 200);
            $table->text('descripcion')->nullable();
            $table->integer('orden')->default(1);
            $table->timestamps();

            $table->foreign('cursoID')
                ->references('cursoID')
                ->on('cursos')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('curso_sesiones');
    }
};

