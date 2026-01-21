<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proyecto extends Model
{
    protected $table = 'proyecto';
    protected $primaryKey = 'proyectoID';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false; // La tabla proyecto NO tiene created_at ni updated_at

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'fecha_entrega' => 'date',
        'images' => 'array', // opcional si usas columna json images
    ];

    protected $fillable = [
        'numero_proyecto',
        'nombre',
        'total',
        'fecha_inicio',
        'fecha_fin',
        'fecha_entrega',
        'clienteID',
        'empleadoID',
        'notas',
        'created_by',
        'estado',
        'tipificacion',
        'images',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'clienteID', 'clienteID');
    }

    public function empleado()
    {
        return $this->belongsTo(Empleado::class, 'empleadoID', 'empleadoID');
    }

    public function detalles()
    {
        return $this->hasMany(ProyectoDetalle::class, 'proyectoID', 'proyectoID');
    }
}
