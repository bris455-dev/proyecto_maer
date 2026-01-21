<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->string('idioma', 10)->default('es')->after('email');
            $table->string('tema', 20)->default('claro')->after('idioma');
            $table->boolean('notificaciones_email')->default(true)->after('tema');
            $table->boolean('notificaciones_nuevos_cursos')->default(true)->after('notificaciones_email');
            $table->boolean('notificaciones_recordatorios')->default(false)->after('notificaciones_nuevos_cursos');
        });
    }

    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->dropColumn([
                'idioma',
                'tema',
                'notificaciones_email',
                'notificaciones_nuevos_cursos',
                'notificaciones_recordatorios'
            ]);
        });
    }
};

