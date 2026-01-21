<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Aplicacion extends Model
{
    protected $table = 'aplicacion';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'nombre',
        'descripcion',
        'categoria',
        'orden',
    ];

    /**
     * Relación con cursos (Many-to-Many)
     */
    public function cursos()
    {
        return $this->belongsToMany(Curso::class, 'curso_aplicacion', 'aplicacion_id', 'cursoID');
    }
}

