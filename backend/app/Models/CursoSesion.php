<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CursoSesion extends Model
{
    protected $table = 'curso_sesiones';
    protected $primaryKey = 'sesionID';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $fillable = [
        'cursoID',
        'nombre',
        'descripcion',
        'orden',
    ];

    /**
     * Relación con curso
     */
    public function curso()
    {
        return $this->belongsTo(Curso::class, 'cursoID', 'cursoID');
    }

    /**
     * Relación con archivos de la sesión
     */
    public function archivos()
    {
        return $this->hasMany(CursoArchivo::class, 'sesionID', 'sesionID')->orderBy('orden');
    }
}

