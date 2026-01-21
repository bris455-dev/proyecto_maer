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
        Schema::create('curso_produccion', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('cursoID');
            $table->unsignedInteger('produccion_id');
            $table->timestamps();

            $table->unique(['cursoID', 'produccion_id']);
            $table->foreign('cursoID')->references('cursoID')->on('cursos')->onDelete('cascade');
            $table->foreign('produccion_id')->references('id')->on('produccion')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('curso_produccion');
    }
};

