<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Empleado extends Model
{
    use HasFactory;

    protected $table = 'empleado';
    protected $primaryKey = 'empleadoID';
    public $timestamps = true;

    protected $fillable = [
        'nombre',
        'dni',
        'cargo',
        'email',
        'estado',
        'rolID'
    ];

    public function usuario()
    {
        return $this->hasOne(User::class, 'empleadoID', 'empleadoID');
    }

    public function proyectos()
    {
        return $this->hasMany(Proyecto::class, 'empleadoID', 'empleadoID');
    }
}
