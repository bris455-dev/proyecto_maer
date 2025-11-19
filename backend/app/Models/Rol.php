<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{
    protected $table = 'rol'; // Ajusta si tu tabla se llama 'roles'
    protected $primaryKey = 'rolID';
    public $timestamps = false;

    protected $fillable = ['nombreRol'];

    /**
     * 🔹 Relación con usuarios
     */
    public function usuarios()
    {
        return $this->hasMany(User::class, 'rolID', 'rolID');
    }

    /**
     * 🔹 Relación con permisos intermedios
     */
    public function rolPermisos()
    {
        return $this->hasMany(RolPermiso::class, 'rolID', 'rolID');
    }

    /**
     * 🔹 Relación directa con permisos usando tabla pivote
     */
    public function permisos()
    {
        return $this->belongsToMany(
            Permiso::class,
            'rolpermiso',
            'rolID',
            'permisoID'
        );
    }
}
