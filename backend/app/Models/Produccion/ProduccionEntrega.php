<?php

namespace App\Models\Produccion;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class ProduccionEntrega extends Model
{
    protected $table = 'produccion_entregas';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'numero_entrega',
        'usuario_asignado_id',
        'usuario_entrega_id',
        'fecha_entrega',
        'motivo',
        'estado',
        'observaciones',
        'created_by'
    ];

    protected $casts = [
        'fecha_entrega' => 'date'
    ];

    /**
     * Relación con usuario asignado (diseñador/técnico)
     */
    public function usuarioAsignado()
    {
        return $this->belongsTo(User::class, 'usuario_asignado_id', 'id');
    }

    /**
     * Relación con usuario que entrega
     */
    public function usuarioEntrega()
    {
        return $this->belongsTo(User::class, 'usuario_entrega_id', 'id');
    }

    /**
     * Relación con usuario creador
     */
    public function creador()
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    /**
     * Relación con detalles
     */
    public function detalles()
    {
        return $this->hasMany(ProduccionEntregaDetalle::class, 'entrega_id', 'id');
    }

    /**
     * Calcular total de la entrega
     */
    public function getTotalAttribute()
    {
        return $this->detalles->sum(function($detalle) {
            return $detalle->cantidad * $detalle->precio_unitario;
        });
    }
}

