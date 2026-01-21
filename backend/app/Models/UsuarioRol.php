<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UsuarioRol extends Model
{
    protected $table = 'usuario_roles';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'usuarioID',
        'rolID',
        'empleadoID',
        'clienteID',
        'activo'
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    // Relaciones
    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuarioID', 'id');
    }

    public function rol()
    {
        return $this->belongsTo(Rol::class, 'rolID', 'rolID');
    }

    public function empleado()
    {
        return $this->belongsTo(Empleado::class, 'empleadoID', 'empleadoID');
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'clienteID', 'clienteID');
    }
}

