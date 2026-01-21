<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AsignarNivelesACursos extends Command
{
    protected $signature = 'cursos:asignar-niveles';
    protected $description = 'Asigna niveles a los cursos existentes basándose en el campo nivel';

    public function handle()
    {
        $this->info('Asignando niveles a cursos existentes...');
        
        $cursos = DB::table('cursos')->get();
        $nivelMap = [
            'Básico' => 'Principiante',
            'Intermedio' => 'Intermedio',
            'Avanzado' => 'Avanzado'
        ];
        
        $asignados = 0;
        foreach ($cursos as $curso) {
            if (empty($curso->nivel)) {
                continue;
            }
            
            $nivelReal = $nivelMap[$curso->nivel] ?? $curso->nivel;
            $nivel = DB::table('nivel')->where('nombre', $nivelReal)->first();
            
            if ($nivel) {
                // Verificar si ya existe la relación
                $existe = DB::table('curso_nivel')
                    ->where('cursoID', $curso->cursoID)
                    ->where('nivel_id', $nivel->id)
                    ->exists();
                
                if (!$existe) {
                    DB::table('curso_nivel')->insert([
                        'cursoID' => $curso->cursoID,
                        'nivel_id' => $nivel->id
                    ]);
                    $asignados++;
                    $this->info("Curso ID {$curso->cursoID} ({$curso->nombre}) asignado a nivel {$nivel->nombre} (ID: {$nivel->id})");
                }
            }
        }
        
        $this->info("Completado. {$asignados} cursos actualizados.");
        return 0;
    }
}

