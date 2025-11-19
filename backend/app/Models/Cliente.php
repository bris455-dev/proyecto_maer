<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    use HasFactory;

    protected $table = 'cliente';
    protected $primaryKey = 'clienteID';
    public $timestamps = true;

    protected $fillable = [
        'nombre',
        'dni_ruc',
        'direccion',
        'pais',
        'email',
        'estado',
        'rolID'
    ];

    // Relación con usuario
    public function usuario()
    {
        return $this->hasOne(User::class, 'clienteID', 'clienteID');
    }

    public function proyectos()
    {
        return $this->hasMany(Proyecto::class, 'clienteID', 'clienteID');
    }
}
