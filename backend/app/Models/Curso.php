<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Software;
use App\Models\Aplicacion;
use App\Models\Nivel;
use App\Models\Produccion;

class Curso extends Model
{
    protected $table = 'cursos';
    protected $primaryKey = 'cursoID';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $casts = [
        'precio' => 'decimal:2',
        'cantidad_horas' => 'integer',
    ];

    protected $fillable = [
        'nombre',
        'descripcion',
        'nivel',
        'cantidad_horas',
        'precio',
        'imagen_portada',
        'objetivos',
        'requisitos',
        'estado',
        'created_by',
    ];

    /**
     * Relación con sesiones
     */
    public function sesiones()
    {
        return $this->hasMany(CursoSesion::class, 'cursoID', 'cursoID')->orderBy('orden');
    }

    /**
     * Relación con archivos
     */
    public function archivos()
    {
        return $this->hasMany(CursoArchivo::class, 'cursoID', 'cursoID')->orderBy('orden');
    }

    /**
     * Relación con matrículas
     */
    public function matriculas()
    {
        return $this->hasMany(Matricula::class, 'cursoID', 'cursoID');
    }

    /**
     * Relación con usuario creador
     */
    public function creador()
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    /**
     * Relación con software (Many-to-Many)
     */
    public function software()
    {
        return $this->belongsToMany(Software::class, 'curso_software', 'cursoID', 'software_id');
    }

    /**
     * Relación con aplicaciones (Many-to-Many)
     */
    public function aplicaciones()
    {
        return $this->belongsToMany(Aplicacion::class, 'curso_aplicacion', 'cursoID', 'aplicacion_id');
    }

    /**
     * Relación con niveles (Many-to-Many)
     */
    public function niveles()
    {
        return $this->belongsToMany(Nivel::class, 'curso_nivel', 'cursoID', 'nivel_id');
    }

    /**
     * Relación con producciones (Many-to-Many)
     */
    public function producciones()
    {
        return $this->belongsToMany(Produccion::class, 'curso_produccion', 'cursoID', 'produccion_id');
    }
}

