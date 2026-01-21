<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Facturacion extends Model
{
    protected $table = 'facturacion';
    protected $primaryKey = 'facturacionID';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $casts = [
        'fecha_emision' => 'date',
        'fecha_vencimiento' => 'date',
        'subtotal' => 'decimal:2',
        'impuesto' => 'decimal:2',
        'descuento' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    protected $fillable = [
        'proyectoID',
        'clienteID',
        'tipo',
        'numero_factura',
        'fecha_emision',
        'fecha_vencimiento',
        'subtotal',
        'impuesto',
        'descuento',
        'total',
        'estado',
        'observaciones',
        'created_by',
    ];

    /**
     * Relación con proyecto
     */
    public function proyecto()
    {
        return $this->belongsTo(Proyecto::class, 'proyectoID', 'proyectoID');
    }

    /**
     * Relación con cliente
     */
    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'clienteID', 'clienteID');
    }

    /**
     * Relación con detalles de facturación
     */
    public function detalles()
    {
        return $this->hasMany(FacturacionDetalle::class, 'facturacionID', 'facturacionID');
    }

    /**
     * Relación con usuario creador
     */
    public function creador()
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    /**
     * Relación con proyectos (para facturas grupales)
     */
    public function proyectos()
    {
        return $this->hasMany(FacturacionProyecto::class, 'facturacionID', 'facturacionID');
    }
}

