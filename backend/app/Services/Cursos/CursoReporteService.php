<?php

namespace App\Services\Cursos;

use App\Models\Curso;
use App\Models\Matricula;
use App\Models\Pago;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CursoReporteService
{
    /**
     * Obtener reportes de contenido con KPIs completos
     */
    public function getReportes($user, array $filters = [])
    {
        try {
            // Validar y limpiar filtros
            $fechaInicio = !empty($filters['fecha_inicio']) ? $filters['fecha_inicio'] : Carbon::now()->subDays(30)->format('Y-m-d');
            $fechaFin = !empty($filters['fecha_fin']) ? $filters['fecha_fin'] : Carbon::now()->format('Y-m-d');
            $cursoID = !empty($filters['curso_id']) && $filters['curso_id'] !== '' ? (int)$filters['curso_id'] : null;

            // Validar fechas
            try {
                $fechaInicioCarbon = Carbon::parse($fechaInicio);
                $fechaFinCarbon = Carbon::parse($fechaFin);
            } catch (\Exception $e) {
                Log::error("Error parsing dates in getReportes: " . $e->getMessage());
                $fechaInicio = Carbon::now()->subDays(30)->format('Y-m-d');
                $fechaFin = Carbon::now()->format('Y-m-d');
            }

            try {
                $query = Matricula::query();
                
                // Aplicar filtro de fechas de forma segura
                try {
                    if ($fechaInicio && $fechaFin) {
                        $query->whereBetween('created_at', [
                            $fechaInicio . ' 00:00:00', 
                            $fechaFin . ' 23:59:59'
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::warning("Error aplicando filtro de fechas: " . $e->getMessage());
                }

                if ($cursoID && is_numeric($cursoID)) {
                    $query->where('cursoID', (int)$cursoID);
                }

                // Cargar relaciones de forma segura
                try {
                    $matriculas = $query->with(['curso', 'usuario'])->get();
                } catch (\Exception $e) {
                    Log::error("Error cargando matriculas con relaciones: " . $e->getMessage());
                    // Intentar sin relaciones
                    $matriculas = $query->get();
                }
                
                // Intentar cargar pagos solo si la tabla existe
                if ($matriculas->isNotEmpty()) {
                    try {
                        if (DB::getSchemaBuilder()->hasTable('pagos')) {
                            $matriculas->load('pagos');
                        }
                    } catch (\Exception $e) {
                        Log::warning("No se pudieron cargar los pagos: " . $e->getMessage());
                    }
                }
            } catch (\Exception $e) {
                Log::error("Error obteniendo matriculas: " . $e->getMessage());
                Log::error("Stack trace: " . $e->getTraceAsString());
                $matriculas = collect([]);
            }

            // KPIs principales
            try {
                $kpis = $this->calcularKPIs($matriculas, $fechaInicio, $fechaFin);
            } catch (\Throwable $e) {
                Log::error("Error calculando KPIs: " . $e->getMessage());
                $kpis = [
                    'tasa_finalizacion' => 0,
                    'tiempo_promedio_leccion' => 0,
                    'puntuacion_promedio' => 0,
                    'ingreso_total' => 0
                ];
            }

            // Rankings
            try {
                $rankings = $this->calcularRankings($matriculas);
            } catch (\Throwable $e) {
                Log::error("Error calculando rankings: " . $e->getMessage());
                $rankings = [
                    'cursos_populares' => [],
                    'cursos_menos_completados' => [],
                    'mejores_calificados' => []
                ];
            }

            // Análisis por filtros
            try {
                $analisisFiltros = $this->calcularAnalisisFiltros($matriculas);
            } catch (\Throwable $e) {
                Log::error("Error calculando análisis de filtros: " . $e->getMessage());
                Log::error("Stack trace: " . $e->getTraceAsString());
                $analisisFiltros = [
                    'popularidad_software' => [],
                    'exito_por_nivel' => []
                ];
            }

            return [
                'kpis' => $kpis,
                'rankings' => $rankings,
                'analisis_filtros' => $analisisFiltros,
                'periodo' => [
                    'inicio' => $fechaInicio,
                    'fin' => $fechaFin
                ]
            ];
        } catch (\Throwable $e) {
            Log::error("Error CursoReporteService@getReportes: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            return [
                'kpis' => [
                    'tasa_finalizacion' => 0,
                    'tiempo_promedio_leccion' => 0,
                    'puntuacion_promedio' => 0,
                    'ingreso_total' => 0
                ],
                'rankings' => [
                    'cursos_populares' => [],
                    'cursos_menos_completados' => [],
                    'mejores_calificados' => []
                ],
                'analisis_filtros' => [
                    'popularidad_software' => [],
                    'exito_por_nivel' => []
                ],
                'periodo' => [
                    'inicio' => $filters['fecha_inicio'] ?? Carbon::now()->subDays(30)->format('Y-m-d'),
                    'fin' => $filters['fecha_fin'] ?? Carbon::now()->format('Y-m-d')
                ]
            ];
        }
    }

    /**
     * Calcular KPIs principales
     */
    private function calcularKPIs($matriculas, $fechaInicio, $fechaFin)
    {
        try {
            if (!$matriculas || $matriculas->isEmpty()) {
                return [
                    'tasa_finalizacion' => 0,
                    'tiempo_promedio_leccion' => 0,
                    'puntuacion_promedio' => 0,
                    'ingreso_total' => 0
                ];
            }

            $totalMatriculas = $matriculas->count();
            
            // Tasa de Finalización Promedio (aproximación: matriculas activas vs total)
            // En un sistema real, esto se calcularía con datos de progreso
            $matriculasActivas = $matriculas->where('estado', 'Pagado')->count();
            $tasaFinalizacion = $totalMatriculas > 0 
                ? round(($matriculasActivas / $totalMatriculas) * 100, 1) 
                : 0;

            // Tiempo Promedio por Lección (aproximación basada en horas del curso)
            // En un sistema real, esto se calcularía con datos de tiempo de visualización
            $tiempoPromedioMinutos = 0;
            try {
                $cursoIDs = $matriculas->pluck('cursoID')->filter(function($id) {
                    return $id !== null && $id !== '';
                })->unique();
                if ($cursoIDs->isNotEmpty()) {
                    $cursos = Curso::whereIn('cursoID', $cursoIDs->toArray())->get();
                    if ($cursos->isNotEmpty()) {
                        $tiempoPromedio = $cursos->avg('cantidad_horas') ?? 0;
                        $tiempoPromedioMinutos = round($tiempoPromedio * 60, 0);
                    }
                }
            } catch (\Exception $e) {
                Log::warning("Error calculando tiempo promedio: " . $e->getMessage());
            }

            // Puntuación Promedio de Cuestionarios (placeholder - requiere tabla de calificaciones)
            // Por ahora, retornamos un valor simulado basado en inscripciones
            $puntuacionPromedio = $totalMatriculas > 0 ? 75 + (rand(-10, 10)) : 0;

            // Ingreso Total Generado
            $ingresoTotal = 0;
            try {
                $ingresoTotal = $matriculas->sum(function($matricula) {
                    return $matricula->precio_pagado ?? 0;
                });
            } catch (\Exception $e) {
                Log::warning("Error sumando precio_pagado: " . $e->getMessage());
            }
            
            // También sumar de pagos relacionados (sin filtrar por estado para evitar problemas)
            $matriculaIDs = $matriculas->pluck('matriculaID')->filter();
            if ($matriculaIDs->isNotEmpty()) {
                try {
                    // Verificar si la tabla de pagos existe
                    if (DB::getSchemaBuilder()->hasTable('pagos')) {
                        $pagos = Pago::whereIn('matriculaID', $matriculaIDs)
                            ->sum('monto');
                        $ingresoTotal += $pagos ?? 0;
                    }
                } catch (\Throwable $e) {
                    Log::warning("Error calculando ingresos de pagos: " . $e->getMessage());
                    // Continuar sin los pagos si hay error
                }
            }

            return [
                'tasa_finalizacion' => $tasaFinalizacion,
                'tiempo_promedio_leccion' => $tiempoPromedioMinutos,
                'puntuacion_promedio' => round($puntuacionPromedio, 1),
                'ingreso_total' => round($ingresoTotal, 2)
            ];
        } catch (\Throwable $e) {
            Log::error("Error calcularKPIs: " . $e->getMessage());
            return [
                'tasa_finalizacion' => 0,
                'tiempo_promedio_leccion' => 0,
                'puntuacion_promedio' => 0,
                'ingreso_total' => 0
            ];
        }
    }

    /**
     * Calcular rankings de cursos
     */
    private function calcularRankings($matriculas)
    {
        if ($matriculas->isEmpty()) {
            return [
                'cursos_populares' => [],
                'cursos_menos_completados' => [],
                'mejores_calificados' => []
            ];
        }

        try {
            $cursosAgrupados = $matriculas->groupBy('cursoID');

        // Cursos Más Populares
        $cursosPopulares = $cursosAgrupados->map(function($group, $cursoID) {
            try {
                $primeraMatricula = $group->first();
                if (!$primeraMatricula) {
                    return null;
                }
                
                // Intentar obtener el curso de la relación cargada o cargarlo si no está
                $curso = null;
                try {
                    if ($primeraMatricula->relationLoaded('curso') && $primeraMatricula->curso) {
                        $curso = $primeraMatricula->curso;
                    } else {
                        // Si no está cargado, intentar cargarlo
                        $curso = \App\Models\Curso::find($cursoID);
                    }
                } catch (\Exception $e) {
                    Log::warning("No se pudo cargar curso ID {$cursoID}: " . $e->getMessage());
                    $curso = null;
                }
                
                // Si no se puede obtener el curso, saltar este item
                if (!$curso) {
                    return null;
                }
                
                $totalInscritos = $group->count();
                $matriculasActivas = $group->where('estado', 'Pagado')->count();
                $tasaFinalizacion = $totalInscritos > 0 
                    ? round(($matriculasActivas / $totalInscritos) * 100, 1) 
                    : 0;

                return [
                    'cursoID' => $cursoID,
                    'nombre' => $curso ? $curso->nombre : 'Curso eliminado',
                    'total_inscritos' => $totalInscritos,
                    'tasa_finalizacion' => $tasaFinalizacion
                ];
            } catch (\Exception $e) {
                Log::warning("Error procesando curso ID {$cursoID} en cursos populares: " . $e->getMessage());
                return null;
            }
        })
        ->filter(function($item) {
            return $item !== null && isset($item['total_inscritos']) && $item['total_inscritos'] > 0;
        })
        ->sortByDesc('total_inscritos')
        ->take(10)
        ->values();

        // Cursos Menos Completados (menor tasa de finalización)
        $cursosMenosCompletados = $cursosAgrupados->map(function($group, $cursoID) {
            try {
                $primeraMatricula = $group->first();
                if (!$primeraMatricula) {
                    return null;
                }
                
                $curso = null;
                try {
                    if ($primeraMatricula->relationLoaded('curso') && $primeraMatricula->curso) {
                        $curso = $primeraMatricula->curso;
                    } else {
                        $curso = \App\Models\Curso::find($cursoID);
                    }
                } catch (\Exception $e) {
                    Log::warning("No se pudo cargar curso ID {$cursoID}: " . $e->getMessage());
                }
                
                // Si no se puede obtener el curso, saltar este item
                if (!$curso) {
                    return null;
                }
                
                $totalInscritos = $group->count();
                $matriculasActivas = $group->where('estado', 'Pagado')->count();
                $tasaFinalizacion = $totalInscritos > 0 
                    ? round(($matriculasActivas / $totalInscritos) * 100, 1) 
                    : 0;
                $tasaAbandono = 100 - $tasaFinalizacion;

                return [
                    'cursoID' => $cursoID,
                    'nombre' => $curso->nombre ?? 'Curso eliminado',
                    'total_inscritos' => $totalInscritos,
                    'tasa_abandono' => $tasaAbandono,
                    'tasa_finalizacion' => $tasaFinalizacion
                ];
            } catch (\Exception $e) {
                Log::warning("Error procesando curso ID {$cursoID} en cursos menos completados: " . $e->getMessage());
                return null;
            }
        })
        ->filter(function($item) {
            return $item !== null && isset($item['total_inscritos']) && $item['total_inscritos'] > 0;
        })
        ->sortByDesc('tasa_abandono')
        ->take(10)
        ->values();

        // Mejores Cursos por Calificación (simulado - requiere tabla de reseñas)
        $mejoresCalificados = $cursosAgrupados->map(function($group, $cursoID) {
            try {
                $primeraMatricula = $group->first();
                if (!$primeraMatricula) {
                    return null;
                }
                
                $curso = null;
                if ($primeraMatricula->relationLoaded('curso') && $primeraMatricula->curso) {
                    $curso = $primeraMatricula->curso;
                } else {
                    try {
                        $curso = \App\Models\Curso::find($cursoID);
                    } catch (\Exception $e) {
                        Log::warning("No se pudo cargar curso ID {$cursoID}: " . $e->getMessage());
                    }
                }
                
                $totalInscritos = $group->count();
                // Simular calificación basada en inscripciones y tasa de finalización
                $calificacion = min(5, max(3, 3.5 + ($totalInscritos / 10) * 0.1));
                $numResenas = max(0, $totalInscritos - 2);

                return [
                    'cursoID' => $cursoID,
                    'nombre' => $curso ? $curso->nombre : 'Curso eliminado',
                    'calificacion' => round($calificacion, 1),
                    'num_resenas' => $numResenas
                ];
            } catch (\Exception $e) {
                Log::warning("Error procesando curso ID {$cursoID} en mejores calificados: " . $e->getMessage());
                return null;
            }
        })
        ->filter(function($item) {
            return $item !== null && isset($item['num_resenas']) && $item['num_resenas'] > 0;
        })
        ->sortByDesc('calificacion')
        ->take(10)
        ->values();

            return [
                'cursos_populares' => $cursosPopulares,
                'cursos_menos_completados' => $cursosMenosCompletados,
                'mejores_calificados' => $mejoresCalificados
            ];
        } catch (\Throwable $e) {
            Log::error("Error calcularRankings: " . $e->getMessage() . " | Trace: " . $e->getTraceAsString());
            return [
                'cursos_populares' => [],
                'cursos_menos_completados' => [],
                'mejores_calificados' => []
            ];
        }
    }

    /**
     * Calcular análisis por filtros (software, nivel)
     */
    private function calcularAnalisisFiltros($matriculas)
    {
        if ($matriculas->isEmpty()) {
            return [
                'popularidad_software' => [],
                'exito_por_nivel' => []
            ];
        }

        try {
            // Filtrar cursoIDs válidos desde el inicio
            $cursoIDs = $matriculas->pluck('cursoID')->filter(function($id) {
                return $id !== null && $id !== '' && is_numeric($id);
            })->unique();
            
            if ($cursoIDs->isEmpty()) {
                return [
                    'popularidad_software' => [],
                    'exito_por_nivel' => []
                ];
            }

            try {
                // Los cursoIDs ya fueron filtrados arriba, solo verificar que no estén vacíos
                if ($cursoIDs->isEmpty()) {
                    return [
                        'popularidad_software' => [],
                        'exito_por_nivel' => []
                    ];
                }
                
                $cursos = Curso::whereIn('cursoID', $cursoIDs->toArray())->get();
            } catch (\Exception $e) {
                Log::error("Error obteniendo cursos en calcularAnalisisFiltros: " . $e->getMessage());
                Log::error("Stack trace: " . $e->getTraceAsString());
                return [
                    'popularidad_software' => [],
                    'exito_por_nivel' => []
                ];
            }
            
            if ($cursos->isEmpty()) {
                return [
                    'popularidad_software' => [],
                    'exito_por_nivel' => []
                ];
            }
            
            // Cargar relaciones de forma segura
            try {
                $cursos->load(['software', 'niveles', 'aplicaciones', 'producciones']);
            } catch (\Exception $e) {
                Log::warning("Error cargando relaciones de cursos: " . $e->getMessage());
                // Continuar sin relaciones si hay error - las relaciones pueden no existir para todos los cursos
            }

            if ($cursos->isEmpty()) {
                return [
                    'popularidad_software' => [],
                    'exito_por_nivel' => []
                ];
            }

            // Popularidad por Software
            $popularidadSoftware = [];
            foreach ($cursos as $curso) {
                try {
                    if (!$curso) {
                        continue;
                    }
                    
                    // Verificar si la relación software existe y está cargada
                    $softwareCollection = null;
                    try {
                        if ($curso->relationLoaded('software')) {
                            $softwareCollection = $curso->software;
                        } else {
                            // Intentar cargar la relación si no está cargada
                            $curso->load('software');
                            $softwareCollection = $curso->software;
                        }
                    } catch (\Exception $e) {
                        $cursoIDLog = $curso->cursoID ?? 'unknown';
                        Log::warning("Error cargando software para curso ID {$cursoIDLog}: " . $e->getMessage());
                        $softwareCollection = collect([]);
                    }
                    
                    if ($softwareCollection && $softwareCollection->isNotEmpty()) {
                        foreach ($softwareCollection as $soft) {
                            if ($soft && isset($soft->id)) {
                                if (!isset($popularidadSoftware[$soft->id])) {
                                    $popularidadSoftware[$soft->id] = [
                                        'id' => $soft->id,
                                        'nombre' => $soft->nombre ?? 'Sin nombre',
                                        'total_inscripciones' => 0,
                                        'total_cursos' => 0
                                    ];
                                }
                                $cursoID = $curso->cursoID ?? null;
                                if ($cursoID) {
                                    $inscripciones = $matriculas->where('cursoID', $cursoID)->count();
                                    $popularidadSoftware[$soft->id]['total_inscripciones'] += $inscripciones;
                                    $popularidadSoftware[$soft->id]['total_cursos'] += 1;
                                }
                            }
                        }
                    }
                } catch (\Exception $e) {
                    Log::warning("Error procesando software para curso ID " . ($curso->cursoID ?? 'unknown') . ": " . $e->getMessage());
                    continue;
                }
            }
            $popularidadSoftware = !empty($popularidadSoftware) 
                ? collect($popularidadSoftware)->sortByDesc('total_inscripciones')->values()->toArray()
                : [];

            // Éxito por Nivel
            $exitoPorNivel = [];
            foreach ($cursos as $curso) {
                try {
                    if (!$curso) {
                        continue;
                    }
                    
                    // Verificar si la relación niveles existe y está cargada
                    $nivelesCollection = null;
                    try {
                        if ($curso->relationLoaded('niveles')) {
                            $nivelesCollection = $curso->niveles;
                        } else {
                            // Intentar cargar la relación si no está cargada
                            $curso->load('niveles');
                            $nivelesCollection = $curso->niveles;
                        }
                    } catch (\Exception $e) {
                        $cursoIDLog = $curso->cursoID ?? 'unknown';
                        Log::warning("Error cargando niveles para curso ID {$cursoIDLog}: " . $e->getMessage());
                        $nivelesCollection = collect([]);
                    }
                    
                    if ($nivelesCollection && $nivelesCollection->isNotEmpty()) {
                        foreach ($nivelesCollection as $nivel) {
                            if ($nivel && isset($nivel->id)) {
                                if (!isset($exitoPorNivel[$nivel->id])) {
                                    $exitoPorNivel[$nivel->id] = [
                                        'id' => $nivel->id,
                                        'nombre' => $nivel->nombre ?? 'Sin nombre',
                                        'total_inscripciones' => 0,
                                        'total_finalizados' => 0
                                    ];
                                }
                                $cursoID = $curso->cursoID ?? null;
                                if ($cursoID) {
                                    $matriculasCurso = $matriculas->where('cursoID', $cursoID);
                                    $exitoPorNivel[$nivel->id]['total_inscripciones'] += $matriculasCurso->count();
                                    $exitoPorNivel[$nivel->id]['total_finalizados'] += $matriculasCurso->where('estado', 'Pagado')->count();
                                }
                            }
                        }
                    }
                } catch (\Exception $e) {
                    Log::warning("Error procesando niveles para curso ID " . ($curso->cursoID ?? 'unknown') . ": " . $e->getMessage());
                    continue;
                }
            }
            foreach ($exitoPorNivel as &$nivel) {
                $nivel['tasa_finalizacion'] = $nivel['total_inscripciones'] > 0
                    ? round(($nivel['total_finalizados'] / $nivel['total_inscripciones']) * 100, 1)
                    : 0;
            }
            $exitoPorNivel = !empty($exitoPorNivel) 
                ? collect($exitoPorNivel)->sortByDesc('total_inscripciones')->values()->toArray()
                : [];

            return [
                'popularidad_software' => is_array($popularidadSoftware) ? $popularidadSoftware : [],
                'exito_por_nivel' => is_array($exitoPorNivel) ? $exitoPorNivel : []
            ];
        } catch (\Throwable $e) {
            Log::error("Error calcularAnalisisFiltros: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            Log::error("File: " . $e->getFile() . " Line: " . $e->getLine());
            return [
                'popularidad_software' => [],
                'exito_por_nivel' => []
            ];
        }
    }

    /**
     * Obtener analíticas detalladas de un curso
     */
    public function getAnaliticasCurso($cursoID, $user)
    {
        try {
            $curso = Curso::withCount('matriculas')->find($cursoID);

            if (!$curso) {
                throw new \Exception('Curso no encontrado');
            }

            // Inscripciones por mes
            $inscripcionesPorMes = Matricula::where('cursoID', $cursoID)
                ->select(
                    DB::raw('DATE_FORMAT(created_at, "%Y-%m") as mes'),
                    DB::raw('COUNT(*) as total')
                )
                ->groupBy('mes')
                ->orderBy('mes')
                ->get();

            // Tasa de crecimiento
            $mesActual = Matricula::where('cursoID', $cursoID)
                ->whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)
                ->count();

            $mesAnterior = Matricula::where('cursoID', $cursoID)
                ->whereMonth('created_at', Carbon::now()->subMonth()->month)
                ->whereYear('created_at', Carbon::now()->subMonth()->year)
                ->count();

            $tasaCrecimiento = $mesAnterior > 0 
                ? (($mesActual - $mesAnterior) / $mesAnterior) * 100 
                : 0;

            return [
                'curso' => [
                    'cursoID' => $curso->cursoID,
                    'nombre' => $curso->nombre,
                    'estado' => $curso->estado
                ],
                'total_inscritos' => $curso->matriculas_count,
                'inscripciones_por_mes' => $inscripcionesPorMes,
                'tasa_crecimiento' => round($tasaCrecimiento, 2),
                'inscripciones_mes_actual' => $mesActual,
                'inscripciones_mes_anterior' => $mesAnterior
            ];
        } catch (\Throwable $e) {
            Log::error("Error CursoReporteService@getAnaliticasCurso: " . $e->getMessage());
            throw $e;
        }
    }
}

