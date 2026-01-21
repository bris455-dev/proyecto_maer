<?php

namespace App\Services;

use App\Models\Curso;
use App\Models\CursoSesion;
use App\Models\CursoArchivo;
use App\Models\Matricula;
use App\Helpers\RoleHelper;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CursoService
{
    /**
     * Listar cursos según el rol del usuario
     */
    public function listForUser($user, array $filters = [])
    {
        try {
            $query = Curso::with([
                'sesiones.archivos', 
                'creador',
                'software',
                'aplicaciones',
                'niveles',
                'producciones'
            ]);

            // Si es estudiante (rol 16), solo mostrar cursos publicados
            $rolEstudianteID = RoleHelper::getRoleIDByName('Estudiante');
            if ($rolEstudianteID && $user->rolID == $rolEstudianteID) {
                $query->where('estado', 'Publicado');
            }

            // Filtro por estado
            if (!empty($filters['estado'])) {
                $query->where('estado', $filters['estado']);
            }

            // Filtro por software (Many-to-Many)
            if (!empty($filters['software_id'])) {
                $query->whereHas('software', function($q) use ($filters) {
                    $q->where('software.id', $filters['software_id']);
                });
            }

            // Filtro por aplicación (Many-to-Many)
            if (!empty($filters['aplicacion_id'])) {
                $query->whereHas('aplicaciones', function($q) use ($filters) {
                    $q->where('aplicacion.id', $filters['aplicacion_id']);
                });
            }

            // Filtro por nivel (Many-to-Many) - nuevo sistema
            if (!empty($filters['nivel_id'])) {
                $query->whereHas('niveles', function($q) use ($filters) {
                    $q->where('nivel.id', $filters['nivel_id']);
                });
            } elseif (!empty($filters['nivel'])) {
                // Mantener compatibilidad con el filtro antiguo (string)
                $query->whereHas('niveles', function($q) use ($filters) {
                    $q->where('nivel.nombre', $filters['nivel']);
                });
            }

            // Filtro por producción (Many-to-Many)
            if (!empty($filters['produccion_id'])) {
                $query->whereHas('producciones', function($q) use ($filters) {
                    $q->where('produccion.id', $filters['produccion_id']);
                });
            }

            // Filtro por precio (gratuito)
            if (isset($filters['gratis']) && $filters['gratis'] === true) {
                $query->where('precio', 0);
            }

            // Filtro por rango de precio
            if (!empty($filters['precio_min'])) {
                $query->where('precio', '>=', $filters['precio_min']);
            }
            if (!empty($filters['precio_max'])) {
                $query->where('precio', '<=', $filters['precio_max']);
            }

            // Búsqueda por texto
            if (!empty($filters['busqueda'])) {
                $query->where(function($q) use ($filters) {
                    $q->where('nombre', 'like', "%{$filters['busqueda']}%")
                      ->orWhere('descripcion', 'like', "%{$filters['busqueda']}%");
                });
            }

            return $query->orderBy('created_at', 'desc')->get();
        } catch (\Throwable $e) {
            Log::error("Error CursoService@listForUser: " . $e->getMessage());
            return collect([]);
        }
    }

    /**
     * Obtener curso por ID
     */
    public function getById(int $cursoID, $user)
    {
        try {
            // Cargar curso con sesiones, archivos de sesiones y archivos generales
            $curso = Curso::with([
                'sesiones' => function($query) {
                    $query->orderBy('orden', 'asc');
                },
                'sesiones.archivos' => function($query) {
                    $query->orderBy('orden', 'asc');
                },
                'archivos' => function($query) {
                    $query->whereNull('sesionID')
                          ->orderBy('orden', 'asc');
                },
                'creador'
            ])->find($cursoID);

            if (!$curso) {
                return null;
            }

            // Si es estudiante (rol 16), solo mostrar si está publicado
            $rolEstudianteID = RoleHelper::getRoleIDByName('Estudiante');
            if ($rolEstudianteID && $user->rolID == $rolEstudianteID && $curso->estado !== 'Publicado') {
                return null;
            }

            return $curso;
        } catch (\Throwable $e) {
            Log::error("Error CursoService@getById: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Crear curso
     */
    public function create(array $data, $actor): array
    {
        DB::beginTransaction();
        try {
            $curso = Curso::create([
                'nombre' => $data['nombre'],
                'descripcion' => $data['descripcion'] ?? null,
                'nivel' => $data['nivel'],
                'cantidad_horas' => $data['cantidad_horas'] ?? 0,
                'precio' => $data['precio'] ?? 0,
                'imagen_portada' => $data['imagen_portada'] ?? null,
                'objetivos' => $data['objetivos'] ?? null,
                'requisitos' => $data['requisitos'] ?? null,
                'estado' => $data['estado'] ?? 'Borrador',
                'created_by' => $actor->id,
            ]);

            // Asignar nivel a la tabla pivot curso_nivel
            if (!empty($data['nivel'])) {
                $nivelNombre = $data['nivel'];
                // Mapear nombres a IDs: Básico -> Principiante, Intermedio -> Intermedio, Avanzado -> Avanzado
                $nivelMap = [
                    'Básico' => 'Principiante',
                    'Intermedio' => 'Intermedio',
                    'Avanzado' => 'Avanzado'
                ];
                $nivelReal = $nivelMap[$nivelNombre] ?? $nivelNombre;
                
                $nivel = \App\Models\Nivel::where('nombre', $nivelReal)->first();
                if ($nivel) {
                    $curso->niveles()->attach($nivel->id);
                }
            }

            // Asignar software, aplicaciones, producciones si vienen en el request
            if (!empty($data['software_ids']) && is_array($data['software_ids'])) {
                $curso->software()->sync($data['software_ids']);
            }
            if (!empty($data['aplicacion_ids']) && is_array($data['aplicacion_ids'])) {
                $curso->aplicaciones()->sync($data['aplicacion_ids']);
            }
            if (!empty($data['produccion_ids']) && is_array($data['produccion_ids'])) {
                $curso->producciones()->sync($data['produccion_ids']);
            }

            DB::commit();

            return [
                'success' => true,
                'data' => $curso->load(['creador', 'niveles', 'software', 'aplicaciones', 'producciones'])
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error CursoService@create: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al crear curso: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Actualizar curso
     */
    public function update(int $cursoID, array $data, $actor): array
    {
        DB::beginTransaction();
        try {
            $curso = Curso::find($cursoID);
            
            if (!$curso) {
                return [
                    'success' => false,
                    'message' => 'Curso no encontrado'
                ];
            }

            $curso->update([
                'nombre' => $data['nombre'] ?? $curso->nombre,
                'descripcion' => $data['descripcion'] ?? $curso->descripcion,
                'nivel' => $data['nivel'] ?? $curso->nivel,
                'cantidad_horas' => $data['cantidad_horas'] ?? $curso->cantidad_horas,
                'precio' => $data['precio'] ?? $curso->precio,
                'imagen_portada' => $data['imagen_portada'] ?? $curso->imagen_portada,
                'objetivos' => $data['objetivos'] ?? $curso->objetivos,
                'requisitos' => $data['requisitos'] ?? $curso->requisitos,
                'estado' => $data['estado'] ?? $curso->estado,
            ]);

            // Actualizar nivel en la tabla pivot curso_nivel
            if (isset($data['nivel'])) {
                $nivelNombre = $data['nivel'];
                $nivelMap = [
                    'Básico' => 'Principiante',
                    'Intermedio' => 'Intermedio',
                    'Avanzado' => 'Avanzado'
                ];
                $nivelReal = $nivelMap[$nivelNombre] ?? $nivelNombre;
                
                $nivel = \App\Models\Nivel::where('nombre', $nivelReal)->first();
                if ($nivel) {
                    $curso->niveles()->sync([$nivel->id]);
                }
            }

            // Actualizar software, aplicaciones, producciones si vienen en el request
            if (isset($data['software_ids']) && is_array($data['software_ids'])) {
                $curso->software()->sync($data['software_ids']);
            }
            if (isset($data['aplicacion_ids']) && is_array($data['aplicacion_ids'])) {
                $curso->aplicaciones()->sync($data['aplicacion_ids']);
            }
            if (isset($data['produccion_ids']) && is_array($data['produccion_ids'])) {
                $curso->producciones()->sync($data['produccion_ids']);
            }

            DB::commit();

            return [
                'success' => true,
                'data' => $curso->load(['sesiones.archivos', 'creador', 'niveles', 'software', 'aplicaciones', 'producciones'])
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error CursoService@update: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al actualizar curso: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Eliminar curso
     */
    public function delete(int $cursoID): array
    {
        DB::beginTransaction();
        try {
            $curso = Curso::with('archivos')->find($cursoID);
            
            if (!$curso) {
                return [
                    'success' => false,
                    'message' => 'Curso no encontrado'
                ];
            }

            // Eliminar archivos físicos
            foreach ($curso->archivos as $archivo) {
                if (Storage::exists($archivo->ruta)) {
                    Storage::delete($archivo->ruta);
                }
            }

            $curso->delete();

            DB::commit();

            return [
                'success' => true,
                'message' => 'Curso eliminado correctamente'
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error CursoService@delete: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al eliminar curso: ' . $e->getMessage()
            ];
        }
    }
}

