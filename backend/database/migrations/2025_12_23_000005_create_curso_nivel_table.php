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
        Schema::create('curso_nivel', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('cursoID');
            $table->unsignedInteger('nivel_id');
            $table->timestamps();

            $table->unique(['cursoID', 'nivel_id']);
            $table->foreign('cursoID')->references('cursoID')->on('cursos')->onDelete('cascade');
            $table->foreign('nivel_id')->references('id')->on('nivel')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('curso_nivel');
    }
};

