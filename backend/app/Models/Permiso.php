<?php

// app/Models/Permiso.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Permiso extends Model
{
    protected $table = 'permiso';         // ← nombre real
    protected $primaryKey = 'permisoID';  // ← clave primaria real
    public $timestamps = false;           // tu tabla NO maneja timestamps

    protected $fillable = [
        'nombreModulo',
        'nombreSubmodulo'
    ];
}
