<?php

namespace App\Models\Produccion;

use Illuminate\Database\Eloquent\Model;
use App\Models\Inventario\ProductoInventario;

class ProduccionEntregaDetalle extends Model
{
    protected $table = 'produccion_entrega_detalles';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'entrega_id',
        'producto_id',
        'cantidad',
        'precio_unitario',
        'observaciones'
    ];

    protected $casts = [
        'cantidad' => 'decimal:2',
        'precio_unitario' => 'decimal:2'
    ];

    /**
     * Relación con entrega
     */
    public function entrega()
    {
        return $this->belongsTo(ProduccionEntrega::class, 'entrega_id', 'id');
    }

    /**
     * Relación con producto
     */
    public function producto()
    {
        return $this->belongsTo(ProductoInventario::class, 'producto_id', 'id');
    }

    /**
     * Calcular subtotal
     */
    public function getSubtotalAttribute()
    {
        return $this->cantidad * $this->precio_unitario;
    }
}

