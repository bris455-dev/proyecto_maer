<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Matricula extends Model
{
    protected $table = 'matriculas';
    protected $primaryKey = 'matriculaID';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $casts = [
        'precio_pagado' => 'decimal:2',
        'fecha_matricula' => 'date',
        'fecha_expiracion' => 'date',
    ];

    protected $fillable = [
        'cursoID',
        'usuarioID',
        'estado',
        'precio_pagado',
        'fecha_matricula',
        'fecha_expiracion',
        'notas',
    ];

    /**
     * Relación con curso
     */
    public function curso()
    {
        return $this->belongsTo(Curso::class, 'cursoID', 'cursoID');
    }

    /**
     * Relación con usuario
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuarioID', 'id');
    }

    /**
     * Relación con pagos
     */
    public function pagos()
    {
        return $this->hasMany(Pago::class, 'matriculaID', 'matriculaID');
    }

    /**
     * Verificar si la matrícula está activa
     */
    public function estaActiva()
    {
        return $this->estado === 'Pagado' && 
               (!$this->fecha_expiracion || $this->fecha_expiracion >= now()->toDateString());
    }
}

