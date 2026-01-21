<?php

namespace App\Models\Inventario;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class ProductoInventario extends Model
{
    protected $table = 'productos_inventario';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'categoria_id',
        'unidad_medida',
        'stock_actual',
        'stock_minimo',
        'stock_maximo',
        'precio_unitario',
        'proveedor',
        'ubicacion',
        'activo',
        'created_by'
    ];

    protected $casts = [
        'stock_actual' => 'decimal:2',
        'stock_minimo' => 'decimal:2',
        'stock_maximo' => 'decimal:2',
        'precio_unitario' => 'decimal:2',
        'activo' => 'boolean'
    ];

    /**
     * Relación con categoría
     */
    public function categoria()
    {
        return $this->belongsTo(CategoriaInventario::class, 'categoria_id', 'id');
    }

    /**
     * Relación con usuario creador
     */
    public function creador()
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    /**
     * Relación con movimientos
     */
    public function movimientos()
    {
        return $this->hasMany(MovimientoInventario::class, 'producto_id', 'id');
    }

    /**
     * Verificar si el stock está bajo el mínimo
     */
    public function stockBajo()
    {
        return $this->stock_actual <= $this->stock_minimo;
    }

    /**
     * Verificar si el stock está sobre el máximo
     */
    public function stockAlto()
    {
        return $this->stock_maximo && $this->stock_actual >= $this->stock_maximo;
    }
}

