<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Nivel extends Model
{
    protected $table = 'nivel';
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
        return $this->belongsToMany(Curso::class, 'curso_nivel', 'nivel_id', 'cursoID');
    }
}

