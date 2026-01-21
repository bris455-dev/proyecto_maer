<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Software extends Model
{
    protected $table = 'software';
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
        return $this->belongsToMany(Curso::class, 'curso_software', 'software_id', 'cursoID');
    }
}

