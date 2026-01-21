<?php

namespace App\Services\Cursos;

use App\Models\Curso;
use App\Models\Matricula;
use App\Helpers\RoleHelper;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CursoDashboardService
{
    /**
     * Obtener KPIs del dashboard
     */
    public function getKPIs($user)
    {
        try {
            // Total de cursos publicados
            $totalPublicados = Curso::where('estado', 'Publicado')->count();

            // Cursos en borrador
            $cursosBorrador = Curso::where('estado', 'Borrador')->count();

            // Nuevas inscripciones hoy
            $hoy = Carbon::now()->startOfDay();
            $nuevasInscripcionesHoy = Matricula::where('created_at', '>=', $hoy)->count();

            // Nuevas inscripciones esta semana
            $semanaInicio = Carbon::now()->startOfWeek();
            $nuevasInscripcionesSemana = Matricula::where('created_at', '>=', $semanaInicio)->count();

            // Tasa de Finalización Promedio
            $totalMatriculas = Matricula::count();
            $matriculasActivas = Matricula::where('estado', 'Pagado')->count();
            $tasaFinalizacion = $totalMatriculas > 0 
                ? round(($matriculasActivas / $totalMatriculas) * 100, 1) 
                : 0;

            // Curso más popular (mayor número de inscripciones)
            $cursoMasPopular = Matricula::select('cursoID', DB::raw('count(*) as total_inscritos'))
                ->groupBy('cursoID')
                ->orderBy('total_inscritos', 'desc')
                ->first();

            $cursoPopularData = null;
            if ($cursoMasPopular) {
                $curso = Curso::find($cursoMasPopular->cursoID);
                if ($curso) {
                    $cursoPopularData = [
                        'cursoID' => $curso->cursoID,
                        'nombre' => $curso->nombre,
                        'total_inscritos' => $cursoMasPopular->total_inscritos
                    ];
                }
            }

            return [
                'total_publicados' => $totalPublicados,
                'cursos_borrador' => $cursosBorrador,
                'nuevas_inscripciones_hoy' => $nuevasInscripcionesHoy,
                'nuevas_inscripciones_semana' => $nuevasInscripcionesSemana,
                'tasa_finalizacion_promedio' => $tasaFinalizacion,
                'curso_mas_popular' => $cursoPopularData
            ];
        } catch (\Throwable $e) {
            Log::error("Error CursoDashboardService@getKPIs: " . $e->getMessage());
            return [
                'total_publicados' => 0,
                'cursos_borrador' => 0,
                'nuevas_inscripciones_hoy' => 0,
                'nuevas_inscripciones_semana' => 0,
                'tasa_finalizacion_promedio' => 0,
                'curso_mas_popular' => null
            ];
        }
    }

    /**
     * Obtener resumen por nivel (Básico, Intermedio, Avanzado)
     */
    public function getResumenPorNivel($user)
    {
        try {
            $niveles = DB::table('nivel')->get();
            $resumen = [];

            foreach ($niveles as $nivel) {
                $cursos = Curso::whereHas('niveles', function($q) use ($nivel) {
                    $q->where('nivel.id', $nivel->id);
                })->get();

                $totalCursos = $cursos->count();
                $totalInscritos = Matricula::whereIn('cursoID', $cursos->pluck('cursoID'))
                    ->count();

                $resumen[] = [
                    'nivel_id' => $nivel->id,
                    'nivel_nombre' => $nivel->nombre,
                    'total_cursos' => $totalCursos,
                    'total_inscritos' => $totalInscritos
                ];
            }

            return $resumen;
        } catch (\Throwable $e) {
            Log::error("Error CursoDashboardService@getResumenPorNivel: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Obtener últimos cursos modificados
     */
    public function getUltimosCursos($user, $limit = 5)
    {
        try {
            $cursos = Curso::with(['niveles', 'creador'])
                ->withCount('matriculas as total_inscritos')
                ->orderBy('updated_at', 'desc')
                ->limit($limit)
                ->get();

            return $cursos->map(function($curso) {
                return [
                    'cursoID' => $curso->cursoID,
                    'nombre' => $curso->nombre,
                    'estado' => $curso->estado,
                    'nivel' => $curso->niveles->pluck('nombre')->join(', ') ?: 'N/A',
                    'total_inscritos' => $curso->total_inscritos ?? 0,
                    'ultima_actualizacion' => $curso->updated_at ? $curso->updated_at->format('Y-m-d H:i') : 'N/A',
                    'creador' => $curso->creador ? $curso->creador->name : 'N/A'
                ];
            });
        } catch (\Throwable $e) {
            Log::error("Error CursoDashboardService@getUltimosCursos: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Obtener lista de cursos con filtros avanzados
     */
    public function getCursosList($user, array $filters = [])
    {
        try {
            $query = Curso::with([
                'creador',
                'software',
                'aplicaciones',
                'niveles',
                'producciones'
            ])
            ->withCount('matriculas as total_inscritos');

            // Búsqueda por título o ID
            if (!empty($filters['busqueda'])) {
                $busqueda = $filters['busqueda'];
                $query->where(function($q) use ($busqueda) {
                    $q->where('nombre', 'like', "%{$busqueda}%")
                      ->orWhere('descripcion', 'like', "%{$busqueda}%")
                      ->orWhere('cursoID', 'like', "%{$busqueda}%");
                });
            }

            // Filtro por estado
            if (!empty($filters['estado'])) {
                $query->where('estado', $filters['estado']);
            }

            // Filtro por nivel
            if (!empty($filters['nivel_id'])) {
                $query->whereHas('niveles', function($q) use ($filters) {
                    $q->where('nivel.id', $filters['nivel_id']);
                });
            }

            // Filtro por software
            if (!empty($filters['software_id'])) {
                $query->whereHas('software', function($q) use ($filters) {
                    $q->where('software.id', $filters['software_id']);
                });
            }

            // Filtro por aplicación
            if (!empty($filters['aplicacion_id'])) {
                $query->whereHas('aplicaciones', function($q) use ($filters) {
                    $q->where('aplicacion.id', $filters['aplicacion_id']);
                });
            }

            // Filtro por producción
            if (!empty($filters['produccion_id'])) {
                $query->whereHas('producciones', function($q) use ($filters) {
                    $q->where('produccion.id', $filters['produccion_id']);
                });
            }

            // Filtro por precio
            if (isset($filters['gratis']) && $filters['gratis'] === true) {
                $query->where('precio', 0);
            }

            if (!empty($filters['precio_min'])) {
                $query->where('precio', '>=', $filters['precio_min']);
            }

            if (!empty($filters['precio_max'])) {
                $query->where('precio', '<=', $filters['precio_max']);
            }

            // Ordenamiento
            $sortBy = $filters['sort_by'] ?? 'created_at';
            $sortOrder = $filters['sort_order'] ?? 'desc';
            $query->orderBy($sortBy, $sortOrder);

            // Paginación
            $perPage = $filters['per_page'] ?? 15;
            $cursos = $query->paginate($perPage);

            // Formatear datos para la tabla
            $cursos->getCollection()->transform(function($curso) {
                return [
                    'cursoID' => $curso->cursoID,
                    'nombre' => $curso->nombre,
                    'estado' => $curso->estado,
                    'nivel' => $curso->niveles->pluck('nombre')->join(', ') ?: 'N/A',
                    'precio' => $curso->precio == 0 ? 'GRATUITO' : '$' . number_format($curso->precio, 2),
                    'total_inscritos' => $curso->total_inscritos ?? 0,
                    'ultima_actualizacion' => $curso->updated_at ? $curso->updated_at->format('Y-m-d H:i') : 'N/A',
                    'creador' => $curso->creador ? $curso->creador->name : 'N/A',
                    'software' => $curso->software->pluck('nombre')->join(', ') ?: 'N/A',
                    'aplicaciones' => $curso->aplicaciones->pluck('nombre')->join(', ') ?: 'N/A'
                ];
            });

            return [
                'cursos' => $cursos->items(),
                'pagination' => [
                    'current_page' => $cursos->currentPage(),
                    'last_page' => $cursos->lastPage(),
                    'per_page' => $cursos->perPage(),
                    'total' => $cursos->total()
                ]
            ];
        } catch (\Throwable $e) {
            Log::error("Error CursoDashboardService@getCursosList: " . $e->getMessage());
            return [
                'cursos' => [],
                'pagination' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 15,
                    'total' => 0
                ]
            ];
        }
    }
}

