<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Limpia usuarios duplicados antes de restaurar el índice único
     */
    public function up(): void
    {
        // Encontrar emails duplicados
        $duplicates = DB::table('usuarios')
            ->select('email', DB::raw('COUNT(*) as count'))
            ->groupBy('email')
            ->having('count', '>', 1)
            ->get();
        
        foreach ($duplicates as $duplicate) {
            // Obtener todos los usuarios con este email, ordenados por ID (más reciente primero)
            $users = DB::table('usuarios')
                ->where('email', $duplicate->email)
                ->orderBy('id', 'desc')
                ->get();
            
            // Mantener el primero (más reciente) y eliminar los demás
            $keepUser = $users->first();
            $usersToDelete = $users->skip(1);
            
            foreach ($usersToDelete as $userToDelete) {
                // Si el usuario a eliminar tiene empleadoID o clienteID, actualizar el usuario que se mantiene
                if ($userToDelete->empleadoID && !$keepUser->empleadoID) {
                    DB::table('usuarios')
                        ->where('id', $keepUser->id)
                        ->update(['empleadoID' => $userToDelete->empleadoID]);
                }
                
                if ($userToDelete->clienteID && !$keepUser->clienteID) {
                    DB::table('usuarios')
                        ->where('id', $keepUser->id)
                        ->update(['clienteID' => $userToDelete->clienteID]);
                }
                
                // Eliminar el usuario duplicado
                DB::table('usuarios')->where('id', $userToDelete->id)->delete();
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No se puede revertir la eliminación de duplicados
    }
};

