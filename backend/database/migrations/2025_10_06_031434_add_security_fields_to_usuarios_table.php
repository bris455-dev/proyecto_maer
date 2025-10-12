<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            // 🔹 Intentos fallidos y bloqueo temporal
            $table->integer('failed_attempts')->default(0)->after('password');
            $table->boolean('is_locked')->default(false)->after('failed_attempts');
            $table->timestamp('lock_expires_at')->nullable()->after('is_locked');

            // 🔹 Campos para recuperación de contraseña
            $table->string('password_reset_token')->nullable()->after('lock_expires_at');
            $table->timestamp('password_reset_expires_at')->nullable()->after('password_reset_token');
        });
    }

    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->dropColumn([
                'failed_attempts',
                'is_locked',
                'lock_expires_at',
                'password_reset_token',
                'password_reset_expires_at'
            ]);
        });
    }
};
