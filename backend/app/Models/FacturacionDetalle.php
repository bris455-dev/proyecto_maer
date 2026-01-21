<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FacturacionDetalle extends Model
{
    protected $table = 'facturacion_detalle';
    protected $primaryKey = 'detalleID';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $casts = [
        'cantidad' => 'integer',
        'precio_unitario' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    protected $fillable = [
        'facturacionID',
        'descripcion',
        'cantidad',
        'precio_unitario',
        'subtotal',
    ];

    /**
     * Relación con facturación
     */
    public function facturacion()
    {
        return $this->belongsTo(Facturacion::class, 'facturacionID', 'facturacionID');
    }
}

