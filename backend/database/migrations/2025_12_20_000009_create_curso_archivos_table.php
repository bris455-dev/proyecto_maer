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
        Schema::create('curso_archivos', function (Blueprint $table) {
            $table->increments('archivoID');
            $table->unsignedInteger('cursoID')->index();
            $table->unsignedInteger('sesionID')->nullable()->index();
            $table->string('nombre_original', 255);
            $table->string('nombre_archivo', 255);
            $table->string('ruta', 500);
            $table->string('tipo', 50); // video, pdf, ppt, imagen, zip, rar
            $table->string('mime_type', 100)->nullable();
            $table->bigInteger('tamaño')->default(0); // en bytes
            $table->integer('orden')->default(1);
            $table->timestamps();

            $table->foreign('cursoID')
                ->references('cursoID')
                ->on('cursos')
                ->onDelete('cascade');
                
            $table->foreign('sesionID')
                ->references('sesionID')
                ->on('curso_sesiones')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('curso_archivos');
    }
};

