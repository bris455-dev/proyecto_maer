<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Cambia el tipo de dato de usuarioID de unsignedInteger a integer
     * para que coincida con el tipo de id en usuarios (int(11))
     */
    public function up(): void
    {
        // Cambiar tipo de usuarioID en matriculas
        DB::statement('ALTER TABLE matriculas MODIFY usuarioID INT(11) NOT NULL');
        
        // Cambiar tipo de usuarioID en pagos
        DB::statement('ALTER TABLE pagos MODIFY usuarioID INT(11) NOT NULL');
        
        // Cambiar tipo de usuarioID en carrito
        DB::statement('ALTER TABLE carrito MODIFY usuarioID INT(11) NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revertir a unsignedInteger (aunque esto puede causar problemas si hay datos)
        DB::statement('ALTER TABLE carrito MODIFY usuarioID INT(10) UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE pagos MODIFY usuarioID INT(10) UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE matriculas MODIFY usuarioID INT(10) UNSIGNED NOT NULL');
    }
};

