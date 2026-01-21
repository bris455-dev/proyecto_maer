<?php

namespace App\Models\Inventario;

use Illuminate\Database\Eloquent\Model;

class CategoriaInventario extends Model
{
    protected $table = 'categorias_inventario';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'nombre',
        'descripcion',
        'activo'
    ];

    protected $casts = [
        'activo' => 'boolean'
    ];

    /**
     * Relación con productos
     */
    public function productos()
    {
        return $this->hasMany(ProductoInventario::class, 'categoria_id', 'id');
    }
}

