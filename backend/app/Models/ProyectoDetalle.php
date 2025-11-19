<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProyectoDetalle extends Model
{
    protected $table = 'proyecto_detalle_diente'; // si tu tabla se llama distinto, ajústalo
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $fillable = [
        'proyectoID',
        'pieza',
        'tratamientoID',
        'precio',
        'color',
    ];

    public function proyecto()
    {
        return $this->belongsTo(Proyecto::class, 'proyectoID', 'proyectoID');
    }

    public function tratamiento()
    {
        return $this->belongsTo(Tratamiento::class, 'tratamientoID', 'tratamientoID');
    }
}
