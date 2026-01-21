<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Carrito extends Model
{
    protected $table = 'carrito';
    protected $primaryKey = 'carritoID';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $fillable = [
        'usuarioID',
        'cursoID',
    ];

    /**
     * Relación con usuario
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuarioID', 'id');
    }

    /**
     * Relación con curso
     */
    public function curso()
    {
        return $this->belongsTo(Curso::class, 'cursoID', 'cursoID');
    }
}

