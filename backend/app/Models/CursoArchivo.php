<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CursoArchivo extends Model
{
    protected $table = 'curso_archivos';
    protected $primaryKey = 'archivoID';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $casts = [
        'tamaño' => 'integer',
        'orden' => 'integer',
    ];

    protected $fillable = [
        'cursoID',
        'sesionID',
        'nombre_original',
        'nombre_archivo',
        'ruta',
        'tipo',
        'mime_type',
        'tamaño',
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
     * Relación con sesión
     */
    public function sesion()
    {
        return $this->belongsTo(CursoSesion::class, 'sesionID', 'sesionID');
    }

    /**
     * Obtener URL completa del archivo
     */
    public function getUrlAttribute()
    {
        return asset('storage/' . $this->ruta);
    }

    /**
     * Obtener tamaño formateado
     */
    public function getTamañoFormateadoAttribute()
    {
        $bytes = $this->tamaño;
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        } else {
            return $bytes . ' bytes';
        }
    }
}

