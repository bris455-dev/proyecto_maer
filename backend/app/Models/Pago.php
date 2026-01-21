<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pago extends Model
{
    protected $table = 'pagos';
    protected $primaryKey = 'pagoID';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $casts = [
        'monto' => 'decimal:2',
        'datos_transaccion' => 'array',
    ];

    protected $fillable = [
        'matriculaID',
        'usuarioID',
        'numero_transaccion',
        'metodo_pago',
        'monto',
        'estado',
        'datos_transaccion',
        'notas',
    ];

    /**
     * Relación con matrícula
     */
    public function matricula()
    {
        return $this->belongsTo(Matricula::class, 'matriculaID', 'matriculaID');
    }

    /**
     * Relación con usuario
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuarioID', 'id');
    }
}

