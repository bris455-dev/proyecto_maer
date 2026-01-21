<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Produccion extends Model
{
    protected $table = 'produccion';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'nombre',
        'descripcion',
        'orden',
    ];

    /**
     * Relación con cursos (Many-to-Many)
     */
    public function cursos()
    {
        return $this->belongsToMany(Curso::class, 'curso_produccion', 'produccion_id', 'cursoID');
    }
}

