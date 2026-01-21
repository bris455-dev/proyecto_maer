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
        Schema::create('curso_aplicacion', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('cursoID');
            $table->unsignedInteger('aplicacion_id');
            $table->timestamps();

            $table->unique(['cursoID', 'aplicacion_id']);
            $table->foreign('cursoID')->references('cursoID')->on('cursos')->onDelete('cascade');
            $table->foreign('aplicacion_id')->references('id')->on('aplicacion')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('curso_aplicacion');
    }
};

